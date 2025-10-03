// src/pages/cart/index.tsx
import Link from "next/link";

interface MenuItem {
  flavor: string;
  image: string;
}

interface ToppingItem {
  name: string;
  image: string;
}

const bingsuMenu: MenuItem[] = [
  { flavor: "Strawberry", image: "/images/strawberry-ice.png" },
  { flavor: "Thai Tea", image: "/images/thai-tea-ice.png" },
  { flavor: "Matcha", image: "/images/matcha-ice.png" },
];

const toppings: ToppingItem[] = [
  { name: "Apple", image: "/images/apple.png" },
  { name: "Blueberry", image: "/images/blueberry.png" },
  { name: "Cherry", image: "/images/cherry.png" },
  { name: "Raspberry", image: "/images/raspberry.png" },
  { name: "Strawberry", image: "/images/strawberry.png" },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      {/* Header */}
      <div className="w-full bg-[#69806C] py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/home">
            <button className="text-white hover:bg-white/20 p-2 rounded-full transition">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-['Iceland'] text-white text-center">
            Bingsu Menu
          </h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Bingsu Gallery */}
        <h2 className="text-3xl font-['Iceland'] text-[#69806C] mb-8">Bingsu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {bingsuMenu.map((item, idx) => (
            <div
              key={idx}
              className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <img
                src={item.image}
                alt={item.flavor}
                className="h-[500px] w-full object-cover object-[center_70%] aspect-5 bg-white"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              <h3 className="absolute bottom-4 left-4 text-white text-2xl font-['Iceland'] drop-shadow-lg">
                {item.flavor} Bingsu
              </h3>
            </div>
          ))}
        </div>

        {/* Topping Gallery */}
        <h2 className="text-3xl font-['Iceland'] text-[#69806C] mb-8">Toppings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {toppings.map((topping, idx) => (
            <div
              key={idx}
              className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <img
                src={topping.image}
                alt={topping.name}
                className="h-60 w-full object-contain bg-white"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <h3 className="absolute bottom-3 left-3 text-white text-lg font-['Iceland'] drop-shadow-md">
                {topping.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
