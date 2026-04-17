import { useRef, useEffect } from "react";

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

    const buttons = buttonsRef.current.filter(Boolean) as HTMLButtonElement[];
    const animations = buttons.map((button, index) => {
      button.style.opacity = "0";
      button.style.transform = "translateY(12px)";

      const animation = button.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 600,
          delay: index * 80,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      );

      animation.onfinish = () => {
        button.style.opacity = "1";
        button.style.transform = "";
      };

      return animation;
    });

    return () => animations.forEach((animation) => animation.cancel());
  }, []);

  const handleClick = (category: string, index: number) => {
    const button = buttonsRef.current[index];
    if (!button) return;

    // Click ripple effect - slower and smoother
    button.animate(
      [
        { transform: "scale(0.97)" },
        { transform: "scale(1)" },
      ],
      {
        duration: 500,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
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
                className={`
                  relative rounded-lg px-4 py-2 text-sm font-medium
                  transition-all duration-200 ease-out
                  ${isActive 
                    ? "text-white" 
                    : "text-[#2E3440] hover:-translate-y-0.5 hover:bg-gray-50"
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
