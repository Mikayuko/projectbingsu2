import NavigationButtons from "./NavigationButtons";

export default function HeaderExclude() {
  return (
    <div className="relative w-full max-w-7xl mx-auto h-[400px] rounded-[20px] overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 2000 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="mask-xor">
            {/* สีขาว = ส่วนที่คงอยู่, ดำ = ส่วนที่เจาะรู */}
            <rect width="3000" height="600" rx="20" fill="white" />
            <rect x="0" y="400" width="900" height="200" rx="10" fill="black" />
          </mask>
        </defs>

        {/* Rectangle หลักที่ถูก mask */}
        <rect width="3000" height="600" rx="20" fill="#D9D9D9" mask="url(#mask-xor)" />

        {/* Background image อยู่ใต้ mask */}
        <image
          xlinkHref="/images/ชาเขียว.jpg"
          x="0"
          y="0"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          mask="url(#mask-xor)"
        />
      </svg>

      <NavigationButtons />
    </div>
  );
}
