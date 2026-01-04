import timelineEvents from './timelineEvents.ts';
import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Pure function to create initial snowflake data
function createSnowflakes(count: number) {
  const flakes = [];
  for (let i = 0; i < count; i++) {
    flakes.push({
      x: (Math.random() - 0.5) * 20,
      y: Math.random() * 18 - 3,
      z: (Math.random() - 0.5) * 20,
      speed: Math.random() * 0.01 + 0.005, // slower fall
      size: Math.random() * 0.13 + 0.07,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      type: 0,
    });
  }
  return flakes;
}

// Simple snow effect for Three.js background
function Snowfall({ count = 120 }) {
  const snowflakes = useMemo(() => createSnowflakes(count), [count]);

  const meshRefs = useRef<(THREE.Group | null)[]>([]);
  
  useFrame(() => {
    // Update snowflake positions - pure physics, no rotation interference
    snowflakes.forEach((flake, i) => {
      flake.y -= flake.speed;
      flake.rotation += flake.rotSpeed;
      if (flake.y < -4) {
        flake.y = Math.random() * 18 - 3;
        flake.x = (Math.random() - 0.5) * 20;
        flake.z = (Math.random() - 0.5) * 20;
        flake.rotation = Math.random() * Math.PI * 2;
      }
      const ref = meshRefs.current[i];
      if (ref) {
        ref.position.set(flake.x, flake.y, flake.z);
        ref.rotation.z = flake.rotation;
      }
    });
  });

  // Three simple snowflake shapes
  function SnowflakeShape({ size, meshRef }: { size: number; meshRef: (ref: THREE.Group | null) => void }) {
    // Only classic 6-pointed
    return (
      <group ref={meshRef}>
        {[...Array(6)].map((_, i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
            <cylinderGeometry args={[size * 0.07, size * 0.07, size, 6]} />
            <meshStandardMaterial color="#eaf6ff" emissive="#fff" emissiveIntensity={1.5} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <>
      {snowflakes.map((flake, i) => (
        <SnowflakeShape key={i} size={flake.size} meshRef={(el: THREE.Group | null) => meshRefs.current[i] = el} />
      ))}
    </>
  );
}


// Modal dialog for viewing full slide details
function SlideDialog({ 
  isOpen, 
  onClose, 
  images, 
  date, 
  blurb 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  images: Array<{ src: string; caption: string }>; 
  date: string; 
  blurb: string; 
}) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  // Reset to first image when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
    }
  }, [isOpen]);

  function formatMonthYear(dateStr: string) {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!isOpen) return null;

  const currentImage = images[currentImageIndex];
  
  // Safety check: ensure we have a valid current image
  if (!currentImage || !images.length) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl p-4 md:p-8 w-full max-w-md md:max-w-5xl h-fit max-h-[90vh] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 md:top-4 right-3 md:right-4 text-white hover:text-gray-300 text-xl md:text-2xl font-bold z-10"
        >
          ×
        </button>
        
        {/* Title */}
        <h2 className="text-white text-lg md:text-2xl font-bold mb-3 md:mb-4 uppercase tracking-wide pr-8">
          {formatMonthYear(date)}
        </h2>
        
        {/* Full blurb */}
        <p className="text-white text-sm md:text-base leading-relaxed mb-4 md:mb-6">
          {blurb}
        </p>
        
        {/* Image carousel */}
        <div className="relative">
          {/* Main image */}
          <div className="flex justify-center mb-3">
            <img
              src={currentImage.src}
              alt={`Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-[450px] rounded-lg shadow-lg object-contain"
            />
          </div>
          
          {/* Image caption */}
          <p className="text-white/80 text-xs md:text-sm italic text-center mb-4 px-2">
            {currentImage.caption}
          </p>

          {/* Navigation arrows - only show if more than 1 image */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-2xl md:text-3xl font-bold bg-black/30 rounded-full w-10 h-10 flex items-center justify-center"
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-2xl md:text-3xl font-bold bg-black/30 rounded-full w-10 h-10 flex items-center justify-center"
              >
                ›
              </button>
            </>
          )}

          {/* Image counter and dots indicator */}
          {images.length > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-3">
              <span className="text-white/60 text-xs">
                {currentImageIndex + 1} / {images.length}
              </span>
              <div className="flex space-x-1">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// TimelineBlurb: shared component for left/right timeline event
function TimelineBlurb({
  images,
  date,
  blurb,
  align,
  onClick
}: {
  images: Array<{ src: string; caption: string }>;
  date: string;
  blurb: string;
  align: 'left' | 'right';
  onClick?: () => void;
}) {
  const isLeft = align === 'left';

  function formatMonthYear(dateStr: string) {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  return (
    <div
      className={`relative flex flex-row items-start w-full max-w-87.5 md:max-w-100 space-x-2 md:space-x-1 py-2 md:py-3 bg-white/18 rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-md border border-white/[0.28] p-2 cursor-pointer hover:bg-white/25 transition-all duration-200 group`}
      onClick={onClick}
    >
      <img
        src={images[0].src}
        alt={`Slide 1`}
        className="w-20 md:w-25 h-20 md:h-25 rounded-sm object-center object-cover shrink-0"
        style={{  boxShadow: '0 2px 12px rgba(0,0,0,0.12)'}}
      />
      <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
        <p className="text-white text-xs md:text-[14px] font-bold px-1 md:px-2 uppercase">{formatMonthYear(date)}</p>
        <p className={`text-xs md:text-sm text-left px-1 md:px-2 text-white m-0 line-clamp-3 ${!isLeft ? ' my-0' : ''}`}>
          {blurb}
        </p>
      </div>
      
      {/* Click indicator button */}
      <div className="absolute top-1 md:top-2 right-1 md:right-2 bg-white/20 backdrop-blur-sm rounded-full p-1 md:p-2 border border-white/30 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200">
        <svg 
          width="12" 
          height="12" 
          className="md:w-4 md:h-4"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </div>
      
      {/* Additional visual hint - hidden on mobile for space */}
      <div className="absolute bottom-2 right-2 text-white/60 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block">
        Click to expand
      </div>
    </div>
  );
}

// ChristmasCarousel: handles 20 slides, each with photo and blurb
function ChristmasCarousel({ slides, onScroll }: { slides: { images: Array<{ src: string; caption: string }>; blurb: string; date: string; }[], onScroll?: (scrollTop: number) => void }) {
  const [selectedSlide, setSelectedSlide] = React.useState<{ images: Array<{ src: string; caption: string }>; blurb: string; date: string; } | null>(null);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      onScroll(e.currentTarget.scrollTop);
    }
  };

  const handleSlideClick = (slide: { images: Array<{ src: string; caption: string }>; blurb: string; date: string; }) => {
    setSelectedSlide(slide);
  };

  const closeDialog = () => {
    setSelectedSlide(null);
  };

  return (
    <>
      <SlideDialog 
        isOpen={!!selectedSlide}
        onClose={closeDialog}
        images={selectedSlide?.images || []}
        date={selectedSlide?.date || ''}
        blurb={selectedSlide?.blurb || ''}
      />
      <div className="w-full h-screen overflow-y-auto" onScroll={handleScroll}>
        {/* Header Section */}
        <div className="relative flex flex-col items-center justify-center py-8 md:py-12 px-4 md:px-6 max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[72px] font-bold text-white text-center mb-6 md:mb-8 tracking-wide leading-tight great-vibes-regular">
            Happy New Year!
            <span className="block text-white-400 mt-2 text-[18px] uppercase font-bold tracking-wider font-sans">from Alyssa & Brian</span>
          </h1>
          
          <section className="mb-4 md:mb-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl w-full px-4 md:px-6 py-3 md:py-4">
            <h2 className="text-white font-semibold text-base md:text-lg mb-4">Our Year in Summary</h2>
            <div className="space-y-4 text-white/90 leading-relaxed text-sm md:text-base">
              <img src="photos/pittsburgh-dinner.jpg" alt="Alyssa and Brian in Pittsburgh" className="w-full h-auto max-h-[500px] rounded-lg shadow-lg object-cover object-center mb-4" />
              <p>
                Dear friends and family. Sorry we haven't sent out an update for 4 years. Turns out a lot has happened since 2021! We've included lots of photos and juicy details for anyone with time to kill (looking at you Grandma) but will keep it short and sweet here.
              </p>
              
              <p className="font-semibold">Here's the last 4 years by the numbers:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Job changes: 4</li>
                <li>New dogs: 1</li>
                <li>Children born: 0</li>
                <li>Countries visited: 6</li>
                <li>Degrees completed: 1</li>
                <li>Marathons run: 1</li>
                <li>National Parks Visited: 6</li>
              </ul>
              
              <p>
                Alyssa worked for a year at a metaverse startup, but started looking for new opportunities when the paychecks kept getting delayed. She worked for 2 years at Compliancy Group as a Senior Software Engineer, before being recruited by a startup recently acquired by Western Governor's University. She's still loving her career in software engineering, especially at her current job where she's been able to focus on transitioning to DevOps and Cloud Infrastructure. Outside of work, she's gotten a lot more into running, picked up video editing, and is still crazy about dog training.
              </p>
              
              <p>
                Brian graduated with his PhD in Robotics from Carnegie Mellon University in 2022, marking the end of an era for us both. After weighing a few different options, he took a leap on a startup called Albedo, a young 20-person startup building low-flying satellites to take insanely good satellite images. They launched their first satellite this year in March 2025. Brian got recruited by NVIDIA and made the difficult decision to leave Albedo right after their first launch, and has been working on developing software for robotics at NVIDIA since March.
              </p>
              
              <p>
                We still live in Pittsburgh, PA, in the small home we bought when we moved here in 2020. We've grown to love Pittsburgh a lot, in big part thanks to the friends we've made here. We've had a lot of incredible experiences over the last 4 years, but are most grateful for the time we've been able to spend with each other, with our dogs, and with friends and family. With the new year, we're excited and a little nervous at what's looking to be a year of adventure, changes, and uncertainty. We hope 2026 brings you joyful moments, the accomplishment of challenges overcome, and the meaning that comes through investing yourself in the relationships you value most.
              </p>
            </div>
          </section>
          
          <section className="mb-4 md:mb-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl w-full px-4 md:px-6 py-3 md:py-4">
            <h2 className="text-white font-semibold text-base md:text-lg mb-4">Frequently Asked Questions</h2>
            <div className="space-y-6 text-white/90 leading-relaxed text-sm md:text-base">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-yellow-200">For the Grandparents</h3>
                <div className="space-y-3 ml-4">
                  <div>
                    <p className="font-medium">Q: Do you have any children?</p>
                    <p className="text-white/80">A: No.</p>
                  </div>
                  <div>
                    <p className="font-medium">Q: Do you want to have children?</p>
                    <p className="text-white/80">A: Maybe.</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-3 text-yellow-200">For Everyone Else</h3>
                <div className="space-y-3 ml-4">
                  <div>
                    <p className="font-medium">Q: What type of dog is River?</p>
                    <p className="text-white/80">A: Sassy b!t@h. Also Golden Irish (half Golden Retriever, half Irish Setter).</p>
                  </div>
                  <div>
                    <p className="font-medium">Q: What type of dog is Tolkien?</p>
                    <p className="text-white/80">A: Nova Scotia Duck Tolling Retriever</p>
                  </div>
                  <div>
                    <p className="font-medium">Q: Favorite place you've visited in the last 4 years?</p>
                    <p className="text-white/80">A: Brian: Dolomites. Alyssa: Dolomites.</p>
                  </div>
                  <div>
                    <p className="font-medium">Q: Favorite meal?</p>
                    <p className="text-white/80">A: Brian: Rifugio Fuciade, Dolomites. Alyssa: Poke, any time, any place.</p>
                  </div>
                  <div>
                    <p className="font-medium">Q: Favorite book?</p>
                    <p className="text-white/80">A: Brian: Meditations for Mortals. Alyssa: Educated.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        
      <div className="relative flex flex-col items-center py-6 md:py-8 px-4 md:px-0">
        {/* Timeline vertical line - positioned behind content */}
        <div className="absolute left-12 -translate-x-1/2 md:left-1/2 md:-translate-x-1/2 w-1 bg-white shadow-[0_0_16px_4px_#fff] top-0 bottom-0" />

        {/* Timeline items */}
        {slides.map((slide, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div key={i} className="relative flex items-center justify-center w-full mb-6 md:mb-8">
              {/* Dot - centered on desktop, left-aligned on mobile */}
              <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 w-8 md:w-10 h-8 md:h-10 rounded-full bg-white/25 border-4 border-white shadow-[0_4px_32px_0_rgba(255,255,255,0.4),0_0_16px_4px_#ffeb3b] backdrop-blur-md flex items-center justify-center z-10 transition-shadow">
                <div className="w-3.5 md:w-4.5 h-3.5 md:h-4.5 rounded-full bg-[#ffeb3b] shadow-[0_0_8px_2px_#ffeb3b]" />
              </div>

              {/* Content - single column on mobile, alternating on desktop */}
              <div className={`flex w-full md:w-1/2 ${isLeft ? 'md:justify-end md:pr-15 md:mr-auto' : 'md:justify-start md:pl-15 md:ml-auto'} pl-16 md:pl-0`}>
                <TimelineBlurb
                  images={slide.images}
                  blurb={slide.blurb}
                  date={slide.date}
                  align={isLeft ? 'left' : 'right'}
                  onClick={() => handleSlideClick(slide)}
                />
              </div>
            </div>
          );
        })}  
      </div>
    </div>
    </>
  );
}

function App() {
  return (
    <div className="w-full h-screen flex items-center justify-center relative" style={{ background: '#10121a' }}>
      {/* Three.js night sky with snow falling */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Canvas camera={{ position: [0, 6, 18], fov: 38 }} shadows>
          <ambientLight intensity={0.7} />
          <color attach="background" args={["#10121a"]} />
          <Snowfall count={120} />
        </Canvas>
      </div>
      {/* Only the timeline line */}
      <ChristmasCarousel
        slides={timelineEvents.map(e => ({
          images: e.images,
          blurb: e.blurb,
          date: e.date
        }))}
      />
    </div>
  );
}

export default App;
