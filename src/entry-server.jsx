import App from "./App.jsx";
import { StrictMode } from "react";
import { StaticRouter } from "react-router-dom/server";
import { makeQueryClient } from "./lib/MakeQueryClient";
import { QueryClientProvider, dehydrate } from "@tanstack/react-query";

export function render(url) {
  const queryClient = makeQueryClient();
  const tree = (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </QueryClientProvider>
    </StrictMode>
  );

  const dehydratedState = dehydrate(queryClient);

  return { tree, dehydratedState };
}
