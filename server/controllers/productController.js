import "dotenv/config";
import cloudinary from "../config/connectCloud.js";
import { Product } from "../models/productModel.js";

function getPublicId(imageURL) {
  const parts = imageURL.split("/");
  const publicId = parts[parts.length - 1].split(".")[0];
  return publicId;
}

async function deleteImagesCloudinary(imagesURL) {
  await Promise.all(
    imagesURL.map((imageURL) =>
      cloudinary.uploader.destroy(getPublicId(imageURL)),
    ),
  );
}

export async function getProducts(req, res) {
  try {
    const {
      cursor,
      limit = 8,
      category,
      minPrice,
      maxPrice,
      search,
      order = "desc",
      sortBy = "createdAt",
    } = req.query;

    const limitNum = Math.min(Number(limit), 50);
    const sortOrder = order === "desc" ? -1 : 1;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) filter.$text = { $search: search };

    function castCursor(value) {
      if (sortBy === "price" || sortBy === "stock") return Number(value);
      if (sortBy === "createdAt" || sortBy === "updatedAt")
        return new Date(value);
      return value;
    }

    if (cursor)
      filter[sortBy] = {
        [order === "desc" ? "$lt" : "$gt"]: castCursor(cursor),
      };

    const Products = await Product.find(filter)
      .sort({
        [sortBy]: sortOrder,
        _id: sortOrder,
      })
      .limit(limitNum + 1)
      .lean();

    const hasNextPage = Products.length > limitNum;
    if (hasNextPage) Products.pop();

    const nextCursor = hasNextPage
      ? Products[Products.length - 1][sortBy]
      : null;

    return res.status(200).json({
      Products,
      nextCursor,
      hasNextPage,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function getProductsFilters(req, res) {
  try {
    const [categories, priceRange] = await Promise.all([
      Product.distinct("category", { isActive: true }),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ]),
    ]);
    return res.status(200).json({
      success: true,
      categories,
      minPrice: priceRange[0]?.minPrice ?? 0,
      maxPrice: priceRange[0]?.maxPrice ?? 0,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product)
      return res.status(400).json({
        success: false,
        message: "Product not found",
      });
    return res.status(200).json({
      product,
      success: true,
      message: `Fetched ${product.name} successfully`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function adminGetProducts(req, res) {
  try {
    const { limit = 10, cursor, isActive } = req.query;

    const limitNum = Math.min(Number(limit), 50);
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (cursor) filter._id = { $lt: cursor };
    const products = await Product.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limitNum + 1)
      .lean();

    const hasNextPage = products.length > limitNum;
    if (hasNextPage) products.pop();
    const nextCursor = hasNextPage ? products[products.length - 1]._id : null;

    return res.status(200).json({
      success: true,
      products,
      hasNextPage,
      nextCursor,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function deleteProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!product)
      return res.status(400).json({
        success: false,
        message: "Product not found",
      });

    return res.status(200).json({
      success: true,
      message: `${product.name} successfully deleted`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, description, price, category, sizes, stock } = req.body;

    const images = req.files?.map((file) => file.path) ?? [];
    if (!images)
      return res.status(400).json({
        success: false,
        message: "At least one image required",
      });
    const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      sizes: parsedSizes,
      images,
      stock: Number(stock),
    });

    return res.status(201).json({
      success: true,
      message: `${product.name} created successfully`,
      product,
    });
  } catch (error) {
    if (req.files?.length > 0)
      deleteImagesCloudinary(req.files.map((f) => f.path));
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function updateProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      if (req.files?.length > 0) {
        await deleteImagesCloudinary(req.files?.map((f) => f.path));
      }
      return res.status(400).json({
        success: false,
        message: "Product not found",
      });
    }
    const { name, description, price, category, sizes, stock, imagesToDelete } =
      req.body;

    let currentImages = [...product.images];
    if (imagesToDelete) {
      const toDelete =
        typeof imagesToDelete === "string"
          ? JSON.parse(imagesToDelete)
          : imagesToDelete;

      await deleteImagesCloudinary(toDelete);

      currentImages = currentImages.filter((img) => !toDelete.includes(img));
    }
    const newImages = req.files?.map((f) => f.path) ?? [];
    const updatedImages = [...currentImages, ...newImages];

    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (price) updates.price = Number(price);
    if (category) updates.category = category;
    if (sizes)
      updates.sizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    if (stock) updates.stock = stock;
    updates.images = updatedImages;

    if (Number(stock) <= 0) {
      updates.isActive = false;
    }

    if (Number(stock) > 0 && !product.isActive) {
      updates.isActive = true;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: `${updatedProduct.name} updated`,
      updatedProduct,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function checkAndDeactivate(productId) {
  try {
    const product = await Product.findById(productId);
    if (!product)
      return res.status(400).json({
        success: false,
        message: "Product not found",
      });
    if (product && product.stock <= 0) {
      await Product.findByIdAndUpdate(productId, { isActive: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Invalid Server Error",
    });
  }
}
