import { revalidatePath } from "next/cache";

export function invalidatePublicCache() {
  revalidatePath("/");
  revalidatePath("/remodeling");
}
