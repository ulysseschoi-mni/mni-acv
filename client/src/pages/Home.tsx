import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const IMAGE_URLS = {
  blue_pants_sketch: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663339494644/QAzaDpzdjFRyPrYY.jpg",
  tshirt_sketch: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663339494644/mVBZmLqwqIRgWDnA.jpg",
  room_1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663339494644/DtRUBikSfnHtVHyP.jpg",
  room_2: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663339494644/BIeYgfDetHuNZibV.jpg",
  room_3: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663339494644/rQXRbtgrpaeNkHZB.jpg",
  room_4: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663339494644/RMMgIkYgZJZLvxql.jpg",
};

type PageId = "home" | "room" | "drops" | "signin";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [introStep, setIntroStep] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageId>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");

  // Splash screen intro sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setIntroStep(1), 500), // Show "mee"
      setTimeout(() => setIntroStep(2), 1500), // Hide "mee"
      setTimeout(() => setIntroStep(3), 2000), // Show "mni acv" small
      setTimeout(() => setIntroStep(4), 3000), // Hide "mni acv" small
      setTimeout(() => setIntroStep(5), 3500), // Show final state
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  // Countdown timer
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const f = (n: number) => (n < 10 ? "0" + n : n);

      if (distance < 0) {
        setCountdown("DROP NOW LIVE");
      } else {
        setCountdown(`${f(days)}:${f(hours)}:${f(minutes)}:${f(seconds)}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const enterSite = () => {
    setShowSplash(false);
    setTimeout(() => setShowNav(true), 500);
  };

  const navigate = (pageId: PageId) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const openModal = (imageSrc: string) => {
    setModalImage(imageSrc);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalImage(null);
    document.body.style.overflow = "auto";
  };

  return (
    <div className="antialiased overflow-hidden">
      {/* Splash Screen */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 bg-white flex flex-col justify-center items-center p-8 text-center transition-transform duration-1000 ${
            !showSplash ? "-translate-y-full" : ""
          }`}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Intro text 1: "mee" */}
            <div
              className={`absolute font-mono text-xl transition-opacity duration-500 ${
                introStep === 1 ? "opacity-100" : "opacity-0"
              }`}
            >
              mee
            </div>

            {/* Intro text 2: "mni acv" small */}
            <div
              className={`absolute font-mono text-xl transition-opacity duration-500 ${
                introStep === 3 ? "opacity-100" : "opacity-0"
              }`}
            >
              mni acv
            </div>

            {/* Final state */}
            <div
              className={`flex flex-col items-center justify-center transition-all duration-1000 ${
                introStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <h1 className="font-scribble text-7xl md:text-9xl tracking-tighter mb-8 font-normal -rotate-2">
                mni acv
              </h1>

              <div className="transition-transform duration-1000">
                <button
                  onClick={enterSite}
                  className="font-scribble text-4xl border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-all transform hover:-rotate-2 shadow-brutal"
                >
                  Start !
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 w-full p-6 flex justify-between items-center z-40 bg-white/90 backdrop-blur-sm border-b-2 border-black transition-opacity duration-500 ${
          showNav ? "opacity-100" : "hidden opacity-0"
        }`}
      >
        <button
          onClick={() => navigate("home")}
          className="font-scribble text-4xl md:text-5xl z-50 hover:rotate-2 transition-transform font-bold"
        >
          mni acv
        </button>

        <nav className="hidden md:flex space-x-8">
          <button
            onClick={() => navigate("home")}
            className="font-bold font-mono hover:bg-brand-periwinkle px-2 hover:-rotate-1 transition-all"
          >
            HOME
          </button>
          <button
            onClick={() => navigate("room")}
            className="font-bold font-mono hover:bg-brand-periwinkle px-2 hover:rotate-1 transition-all"
          >
            ROOM
          </button>
          <button
            onClick={() => navigate("drops")}
            className="font-bold font-mono hover:bg-brand-periwinkle px-2 hover:-rotate-1 transition-all text-red-600"
          >
            DROPS
          </button>
          <button
            onClick={() => navigate("signin")}
            className="font-bold font-mono hover:bg-brand-periwinkle px-2 hover:rotate-1 transition-all"
          >
            SIGN IN
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMenu}
          className="md:hidden font-mono font-bold border-2 border-black px-2 py-1 text-sm bg-white"
        >
          MENU
        </button>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b-2 border-black p-4 flex flex-col space-y-4 shadow-xl">
            <button onClick={() => navigate("home")} className="text-left font-mono font-bold text-xl">
              HOME
            </button>
            <button onClick={() => navigate("room")} className="text-left font-mono font-bold text-xl">
              ROOM
            </button>
            <button
              onClick={() => navigate("drops")}
              className="text-left font-mono font-bold text-xl text-red-600"
            >
              DROPS
            </button>
            <button onClick={() => navigate("signin")} className="text-left font-mono font-bold text-xl">
              SIGN IN
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="relative min-h-screen">
        {/* HOME SECTION */}
        <section
          className={`section px-4 pt-32 pb-20 ${currentPage === "home" ? "active" : "hidden-section"}`}
        >
          {/* Hero Block */}
          <div className="min-h-[85vh] flex flex-col items-center justify-center text-center max-w-4xl mx-auto mb-24">
            <div className="relative inline-block mb-8 md:mb-12">
              <div className="w-48 h-48 md:w-72 md:h-72 border-none flex flex-col items-center justify-center bg-[#9da8ff] rotate-2 shadow-[4px_4px_10px_0px_rgba(0,0,0,0.3)] space-y-2 p-4">
                <span className="font-marker text-4xl md:text-6xl tracking-tight text-black font-normal leading-none transform -rotate-1">
                  mni acv
                </span>
                <span className="font-marker text-4xl md:text-6xl tracking-tight text-black font-normal leading-none transform rotate-1">
                  mni acv
                </span>
                <span className="font-marker text-5xl md:text-7xl tracking-tight text-black font-normal leading-none transform -rotate-2">
                  mni acv
                </span>
              </div>
              <div className="absolute -top-6 -right-6 bg-white border-2 border-black px-3 py-1 font-mono text-xs rotate-12">
                #ARCHIVE_01
              </div>
            </div>

            <h2 className="font-mono text-xl md:text-3xl mb-6 leading-relaxed max-w-2xl font-normal text-gray-800">
              The chaotic yet lovely universe of Meenoi.
              <br />
              Welcome to the first archive.
            </h2>
            <div className="animate-bounce mt-12">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Story Block 1 */}
          <div className="max-w-3xl mx-auto space-y-32 mb-32">
            <div className="flex flex-col md:flex-row items-center gap-12 group">
              <div className="w-full md:w-1/2 border-2 border-black p-4 bg-white shadow-brutal rotate-1 group-hover:-rotate-1 transition-transform">
                <div className="aspect-square bg-white flex items-center justify-center overflow-hidden border-2 border-transparent p-2">
                  <img
                    src={IMAGE_URLS.blue_pants_sketch}
                    alt="doodle of pants"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2 text-left">
                <h3 className="font-marker text-3xl mb-4">it started with a doodle.</h3>
                <p className="font-mono text-gray-600 leading-relaxed text-sm md:text-base">
                  We don't do "fashion". We do captured moments of chaos. Every piece in the mni acv
                  collection begins as a midnight scribble on a receipt or a napkin.
                </p>
              </div>
            </div>

            {/* Story Block 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 group">
              <div className="w-full md:w-1/2 border-2 border-black p-4 bg-white shadow-brutal -rotate-1 group-hover:rotate-1 transition-transform">
                <div className="aspect-square bg-white flex items-center justify-center overflow-hidden border-2 border-transparent p-2">
                  <img
                    src={IMAGE_URLS.tshirt_sketch}
                    alt="mni acv t-shirt design"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2 text-left md:text-right">
                <h3 className="font-marker text-3xl mb-4">from trash to treasure.</h3>
                <p className="font-mono text-gray-600 leading-relaxed text-sm md:text-base">
                  Why wear a logo when you can wear a mistake? Our limited drops turn the imperfections of
                  daily life into wearable statements. Join the secret club.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links Block */}
          <div className="max-w-4xl mx-auto text-center border-t-2 border-dashed border-black pt-20">
            <h3 className="font-scribble text-5xl mb-12">Where do you want to go?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div
                onClick={() => navigate("drops")}
                className="cursor-pointer border-2 border-black p-8 hover:bg-black hover:text-white transition-all group"
              >
                <h4 className="font-mono font-bold text-2xl mb-2">THE DROPS</h4>
                <p className="font-mono text-sm opacity-60 group-hover:opacity-100">
                  Get the latest gear before it's gone.
                </p>
                <div className="mt-4 text-right">
                  <svg className="inline-block w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div
                onClick={() => navigate("room")}
                className="cursor-pointer border-2 border-black p-8 hover:bg-brand-periwinkle transition-all group"
              >
                <h4 className="font-mono font-bold text-2xl mb-2">THE ROOM</h4>
                <p className="font-mono text-sm opacity-60 group-hover:opacity-100">
                  Explore the archive of chaos.
                </p>
                <div className="mt-4 text-right">
                  <svg className="inline-block w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROOM SECTION */}
        <section
          className={`section min-h-screen flex flex-col items-center justify-center pt-20 pb-4 px-4 overflow-hidden ${
            currentPage === "room" ? "active animate-slide-up" : "hidden-section"
          }`}
        >
          <h2 className="font-marker text-4xl md:text-5xl mb-2">the room</h2>
          <p className="font-mono text-gray-600 mb-6 text-sm">a collection of oddities.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-5xl w-full">
            {[IMAGE_URLS.room_1, IMAGE_URLS.room_2, IMAGE_URLS.room_3, IMAGE_URLS.room_4].map(
              (src, idx) => (
                <div
                  key={idx}
                  onClick={() => openModal(src)}
                  className="bg-white p-2 border-2 border-black shadow-brutal hover:-translate-y-1 hover:shadow-brutal-hover transition-all cursor-pointer"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden flex items-center justify-center">
                    <img src={src} alt={`Room Item ${idx + 1}`} className="w-full h-full object-contain" />
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* DROPS SECTION */}
        <section
          className={`section min-h-screen flex flex-col items-center justify-center pt-20 pb-4 px-4 overflow-hidden ${
            currentPage === "drops" ? "active animate-slide-up" : "hidden-section"
          }`}
        >
          <div className="max-w-5xl mx-auto text-center w-full">
            <h2 className="font-marker text-4xl md:text-5xl mb-8">next drop</h2>

            <div className="font-mono text-xl md:text-3xl bg-black text-brand-periwinkle inline-block px-4 py-2 mb-12 border-4 border-transparent shadow-brutal">
              {countdown}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 text-left max-w-4xl mx-auto mb-12">
              {/* Product 1 */}
              <div className="border-2 border-black p-4 bg-white relative flex flex-col md:flex-row gap-4 items-center">
                <div className="bg-gray-100 w-32 h-32 md:w-40 md:h-40 shrink-0 flex items-center justify-center border border-black">
                  <span className="font-scribble text-2xl">Tee</span>
                </div>
                <div className="w-full">
                  <h3 className="font-mono font-bold text-lg mb-1 leading-tight">TOILET PAPER TEE</h3>
                  <p className="font-mono text-xs text-gray-600 mb-2">$80.00 USD</p>
                  <button className="w-full py-2 bg-black text-white font-mono text-sm hover:bg-brand-periwinkle hover:text-black transition-colors">
                    PRE-ORDER
                  </button>
                </div>
              </div>

              {/* Product 2 */}
              <div className="border-2 border-black p-4 bg-white relative flex flex-col md:flex-row gap-4 items-center">
                <div className="bg-gray-100 w-32 h-32 md:w-40 md:h-40 shrink-0 flex items-center justify-center border border-black">
                  <span className="font-scribble text-2xl">Hoodie</span>
                </div>
                <div className="w-full">
                  <h3 className="font-mono font-bold text-lg mb-1 leading-tight">STICK HOODIE</h3>
                  <p className="font-mono text-xs text-gray-600 mb-2">$120.00 USD</p>
                  <button className="w-full py-2 bg-black text-white font-mono text-sm hover:bg-brand-periwinkle hover:text-black transition-colors">
                    PRE-ORDER
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setLocation("/drops")}
              className="mt-12 px-8 py-4 bg-black text-white font-mono font-bold border-2 border-black hover:bg-brand-periwinkle hover:text-black transition-all text-lg"
            >
              VIEW ALL DROPS →
            </button>
          </div>
        </section>

        {/* SIGN IN SECTION */}
        <section
          className={`section px-4 flex items-center justify-center pt-20 md:pt-24 ${
            currentPage === "signin" ? "active animate-slide-up" : "hidden-section"
          }`}
        >
          <div className="max-w-md w-full border-2 border-black p-6 md:p-8 shadow-brutal-lg bg-white transform rotate-1">
            <h2 className="font-marker text-3xl md:text-4xl mb-6 md:mb-8 text-center">join the acv</h2>
            <form className="space-y-6">
              <div>
                <label className="block font-mono text-sm font-bold mb-2">CODENAME</label>
                <input
                  type="text"
                  className="w-full border-2 border-black p-3 font-mono focus:outline-none focus:bg-brand-periwinkle/20 focus:shadow-brutal transition-all"
                />
              </div>
              <div>
                <label className="block font-mono text-sm font-bold mb-2">SECRET KEY</label>
                <input
                  type="password"
                  className="w-full border-2 border-black p-3 font-mono focus:outline-none focus:bg-brand-periwinkle/20 focus:shadow-brutal transition-all"
                />
              </div>
              <button
                type="button"
                className="w-full border-2 border-black bg-black text-white font-mono font-bold py-4 hover:bg-white hover:text-black hover:shadow-brutal transition-all"
              >
                ACCESS
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 w-full p-4 flex justify-between items-end mix-blend-difference text-gray-500 z-30 pointer-events-none">
        <div className="font-mono text-xs">© 2026 MNI ACV</div>
        <div className="font-mono text-xs text-right">
          SCRIBBLE BRAND
          <br />
          EST. 2026
        </div>
      </footer>

      {/* Image Modal */}
      {modalImage && (
        <div
          onClick={closeModal}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 transition-opacity duration-300"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={modalImage} alt="Gallery item" className="max-w-full max-h-[90vh] object-contain" />
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-white text-black font-mono font-bold px-4 py-2 border-2 border-black shadow-brutal hover:bg-brand-periwinkle transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
