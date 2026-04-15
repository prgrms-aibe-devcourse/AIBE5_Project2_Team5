import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Heart, Eye } from "lucide-react";

interface Project {
  id: number;
  title: string;
  author: string;
  badge?: string;
  category: string;
  likes: number;
  views: number;
  tags: string[];
  imageUrl: string;
}

interface ProjectsGridProps {
  projects: Project[];
}

export default function ProjectsGrid({ projects }: ProjectsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Entrance animation when projects change
  useEffect(() => {
    if (!gridRef.current) return;

    const ctx = gsap.context(() => {
      // Reset all cards
      gsap.set(cardsRef.current.filter(Boolean), { 
        opacity: 0, 
        y: 16 
      });

      // Staggered entrance - slower and more elegant
      gsap.to(cardsRef.current.filter(Boolean), {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power3.out"
      });
    }, gridRef);

    return () => ctx.revert();
  }, [projects]);

  const handleMouseEnter = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      y: -8,
      duration: 0.4,
      ease: "power2.out"
    });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      y: 0,
      duration: 0.4,
      ease: "power2.out"
    });
  };

  return (
    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {projects.map((project, index) => (
        <div
          key={project.id}
          ref={(el) => { cardsRef.current[index] = el; }}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={() => handleMouseLeave(index)}
          className="group cursor-pointer will-change-transform"
        >
          <div className="bg-white rounded-2xl overflow-hidden mb-3 aspect-square relative shadow-sm hover:shadow-xl transition-shadow border border-gray-100 hover:border-[#00C9A7]">
            <ImageWithFallback
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Overlay Info */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
              <div className="flex items-center gap-1.5 font-semibold">
                <Heart className="size-5 fill-white" />
                {project.likes}
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <Eye className="size-5" />
                {project.views}
              </div>
            </div>

            {project.badge && (
              <div className="absolute top-3 right-3 bg-[#00C9A7] text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md">
                {project.badge}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-bold text-sm mb-0.5 truncate text-[#0F0F0F] group-hover:text-[#00A88C] transition-colors">
                {project.title}
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">{project.author}</p>
            </div>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-semibold shrink-0">
              {project.category}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
