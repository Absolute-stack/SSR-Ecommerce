import cloudinary from "../config/connectCloud.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "linux/productImages",
    allowed_formats: ["jpg", "jpeg", "webp", "png", "avif"],
    transformations: [
      { quality: "auto" },
      { fetch_format: "auto" },
      { width: 800, height: 800, crop: "limit" },
    ],
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
