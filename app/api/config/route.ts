import { getDb } from "@/lib/db";

export const revalidate = 60;

const PUBLIC_KEYS = new Set([
  "slogan_text",
  "slogan_text_style",
  "photo_guide_title",
  "photo_guide_caption",
  "photo_guide_style",
  "photo_guide_visible",
  "header_logo_visible",
  "header_logo_width",
  "header_logo_offset_y",
  "service_remodeling_title",
  "service_remodeling_desc",
  "service_remodeling_caption",
  "service_remodeling_title_style",
  "service_remodeling_desc_style",
  "service_remodeling_caption_style",
  "service_remodeling_visible",
  "service_building_title",
  "service_building_desc",
  "service_building_caption",
  "service_building_title_style",
  "service_building_desc_style",
  "service_building_caption_style",
  "service_building_visible",
  "service_rental_title",
  "service_rental_desc",
  "service_rental_caption",
  "service_rental_title_style",
  "service_rental_desc_style",
  "service_rental_caption_style",
  "service_rental_visible",
  "service_category4_title",
  "service_category4_desc",
  "service_category4_caption",
  "service_category4_style",
  "service_category4_title_style",
  "service_category4_desc_style",
  "service_category4_caption_style",
  "service_category4_visible",
  "footer_name",
  "footer_english_name",
  "footer_ceo",
  "footer_address",
  "footer_business_number",
  "footer_phone",
  "footer_label_name",
  "footer_label_ceo",
  "footer_label_address",
  "footer_label_business_number",
  "footer_label_phone",
  "footer_label_name_spacing",
  "footer_label_ceo_spacing",
  "footer_label_address_spacing",
  "footer_label_business_number_spacing",
  "footer_label_phone_spacing",
  "footer_colon_left_offset",
  "footer_colon_right_offset",
]);

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM site_config").all() as {
    key: string;
    value: string;
  }[];
  const config: Record<string, string> = {};
  for (const row of rows) {
    if (PUBLIC_KEYS.has(row.key)) config[row.key] = row.value;
  }
  return Response.json(config);
}
