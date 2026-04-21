import { revalidatePath } from "next/cache";

export function invalidatePublicCache() {
  revalidatePath("/");
  revalidatePath("/remodeling");
  revalidatePath("/remodeling/[id]", "page");
}
