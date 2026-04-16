import { useRef, useEffect } from "react";
import { gsap } from "gsap";

interface CategoryButtonsProps {
  categories: string[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
}

export default function CategoryButtons({ 
  categories, 
  selectedCategory, 
  onSelect 
}: CategoryButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.fromTo(
        buttonsRef.current.filter(Boolean),
        { 
          opacity: 0, 
          y: 12,
        },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out"
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleClick = (category: string, index: number) => {
    const button = buttonsRef.current[index];
    if (!button) return;

    // Click ripple effect - slower and smoother
    gsap.fromTo(
      button,
      { scale: 0.97 },
      { 
        scale: 1, 
        duration: 0.5, 
        ease: "elastic.out(1, 0.6)" 
      }
    );

    onSelect(selectedCategory === category ? null : category);
  };

  return (
    <div className="mb-8 flex justify-center">
      <div className="inline-flex max-w-full">
        <div 
          ref={containerRef}
          className="flex w-max items-center gap-2 whitespace-nowrap rounded-xl border border-[#E6E8EB] bg-white px-2 py-2 overflow-x-auto overflow-y-hidden"
        >
          {categories.map((category, index) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                ref={(el) => { buttonsRef.current[index] = el; }}
                type="button"
                onClick={() => handleClick(category, index)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    gsap.to(e.currentTarget, { 
                      y: -3, 
                      duration: 0.4, 
                      ease: "power2.out" 
                    });
                  }
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { 
                    y: 0, 
                    duration: 0.4, 
                    ease: "power2.out" 
                  });
                }}
                className={`
                  relative rounded-lg px-4 py-2 text-sm font-medium
                  transition-colors duration-200
                  ${isActive 
                    ? "text-white" 
                    : "text-[#2E3440] hover:bg-gray-50"
                  }
                `}
              >
                {/* Active background */}
                {isActive && (
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00C9A7] to-[#00A88C]" />
                )}
                <span className="relative z-10">{category}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
