import App from "./App.jsx";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { getQueryClient } from "./lib/MakeQueryClient";
import { QueryClientProvider, HydrationBoundary } from "@tanstack/react-query";

const queryClient = getQueryClient();
const dehydratedState = window.__REACT_QUERY_STATE__;
hydrateRoot(
  document.getElementById("root"),
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HydrationBoundary>
    </QueryClientProvider>
  </StrictMode>,
);
