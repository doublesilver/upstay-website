import { ProtectedImage } from "@/components/protected-image";
import Link from "next/link";
import { Container } from "@/components/container";
import { getAllCases } from "@/lib/home-data";
import { blurDataURL } from "@/lib/shimmer";

export const revalidate = 60;

export default function RemodelingPage() {
  const cases = getAllCases();

  return (
    <Container className="pt-8 pb-12 md:pt-16 md:pb-16">
      <div className="space-y-4 md:space-y-5 bg-[#F1F8E9] border border-[#111111] rounded-xl p-3 md:p-4">
        {cases.map((c) => {
          const befores = c.before_images?.length
            ? c.before_images
            : [c.before_image].filter(Boolean);
          const afters = c.after_images?.length
            ? c.after_images
            : [c.after_image].filter(Boolean);
          return (
            <Link
              key={c.id}
              href={`/remodeling/${c.id}`}
              className="block w-full bg-white border border-[#111111] rounded-xl p-2 md:p-3 text-left hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div>
                  <p className="text-[11px] md:text-[11px] text-[#666] mb-1 font-medium">
                    Before (전)
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {befores.slice(0, 4).map((url, j) => (
                      <div
                        key={j}
                        className="aspect-square border border-[#111] rounded overflow-hidden bg-[#F1F8E9] relative"
                      >
                        <ProtectedImage
                          src={url}
                          alt={`${c.title || "리모델링 사례"} 시공 전 ${j + 1}번째 사진`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 45vw, 20vw"
                          quality={70}
                          placeholder="blur"
                          blurDataURL={blurDataURL()}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <span className="text-[18px] md:text-[22px] font-black text-[#111]">
                  &rarr;
                </span>
                <div>
                  <p className="text-[11px] md:text-[11px] text-[#666] mb-1 font-medium">
                    After (후)
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {afters.slice(0, 4).map((url, j) => (
                      <div
                        key={j}
                        className="aspect-square border border-[#111] rounded overflow-hidden bg-[#F1F8E9] relative"
                      >
                        <ProtectedImage
                          src={url}
                          alt={`${c.title || "리모델링 사례"} 시공 후 ${j + 1}번째 사진`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 45vw, 20vw"
                          quality={70}
                          placeholder="blur"
                          blurDataURL={blurDataURL()}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
