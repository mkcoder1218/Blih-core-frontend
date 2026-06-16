import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Carousel({ className, children, ...props }: React.ComponentProps<"div">) {
  const viewportRef = React.useRef<HTMLDivElement>(null)

  const scroll = (direction: "prev" | "next") => {
    const viewport = viewportRef.current
    if (!viewport) return
    const amount = Math.max(280, viewport.clientWidth * 0.85)
    viewport.scrollBy({ left: direction === "next" ? amount : -amount, behavior: "smooth" })
  }

  return (
    <div className={cn("relative", className)} {...props}>
      <div
        ref={viewportRef}
        className="overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-10 bg-gradient-to-r from-white/90 to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-10 bg-gradient-to-l from-white/90 to-transparent sm:block" />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => scroll("prev")}
        className="absolute -left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white shadow-sm sm:inline-flex"
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => scroll("next")}
        className="absolute -right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white shadow-sm sm:inline-flex"
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex gap-4", className)} {...props} />
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-w-0 shrink-0 basis-full sm:basis-[calc(50%-0.5rem)]", className)} {...props} />
}

export { Carousel, CarouselContent, CarouselItem }
