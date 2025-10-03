import Link from "next/link";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-white text-gray-800 antialiased pb-5">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex justify-between items-center p-4">
          <Link
            href="/"
            className="text-3xl font-extrabold text-gray-800 tracking-tight"
          >
            <span className="text-teal-500">Clean</span>Nami
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-teal-500 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-teal-500 font-medium transition-colors"
            >
              About Us
            </Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <Link href="/" className="text-gray-400 hover:text-white">
              Home
            </Link>
            <Link href="/about" className="text-gray-400 hover:text-white">
              About Us
            </Link>
          </div>
          <div className="mt-8 mb-6 text-sm">
            <a
              href="mailto:cleannami@ceenami.com"
              className="hover:text-white transition-colors duration-300"
            >
              cleannami@ceenami.com
            </a>
            <span className="mx-2 text-gray-600">&bull;</span>
            <a
              href="tel:407-708-8643"
              className="hover:text-white transition-colors duration-300"
            >
              407-708-8643
            </a>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} CleanNami. All rights reserved.
          </p>
          <p className="text-sm mt-2">
            Built by{" "}
            <a
              href="https://trochiedigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline transition-colors duration-300"
            >
              Trotchie Digital Solutions
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
