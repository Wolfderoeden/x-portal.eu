import { getDeployStore, getStore } from "@netlify/blobs";

export function privateDocumentsStore() {
  if (process.env.CONTEXT === "production") {
    return getStore("xportal-private-documents", { consistency: "strong" });
  }
  return getDeployStore("xportal-private-documents");
}
