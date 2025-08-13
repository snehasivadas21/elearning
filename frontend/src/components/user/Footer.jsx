const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 px-6 mt-16">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 sm:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xl font-bold mb-2">PyTech</h4>
          <p className="text-sm text-gray-400">
            Empowering learners with cutting-edge tech education.
          </p>
          <div>
            <div className="flex space-x-4 mt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <svg className="w-6 h-6 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.2 3-3.2.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3H14v7A10 10 0 0 0 22 12z" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <svg className="w-6 h-6 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.6-2.46.71a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04 4.28 4.28 0 0 0-7.29 3.9A12.13 12.13 0 0 1 3.15 4.6a4.28 4.28 0 0 0 1.33 5.72A4.25 4.25 0 0 1 2.8 9v.05a4.28 4.28 0 0 0 3.43 4.2 4.28 4.28 0 0 1-1.12.15c-.28 0-.56-.03-.83-.08a4.28 4.28 0 0 0 4 2.97A8.6 8.6 0 0 1 2 19.54a12.14 12.14 0 0 0 6.56 1.92c7.87 0 12.17-6.53 12.17-12.2 0-.18 0-.36-.01-.54A8.66 8.66 0 0 0 24 4.56a8.5 8.5 0 0 1-2.54.7z" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <svg className="w-6 h-6 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14a5 5 0 0 0-5 5v14a5 5 0 0 0 5 5h14a5 5 0 0 0 5-5v-14a5 5 0 0 0-5-5zm-11 19h-3v-10h3v10zm-1.5-11.3a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zm13.5 11.3h-3v-5.6c0-1.3-.5-2.2-1.6-2.2s-1.8.8-1.8 2v5.8h-3v-10h3v1.4c.4-.7 1.3-1.6 3-1.6 2.2 0 3.4 1.5 3.4 4.3v5.9z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-2">Company</h4>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>About</li>
            <li>Services</li>
            <li>Certifications</li>
            <li>Careers</li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-2">Courses</h4>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>Web Development</li>
            <li>Data Structures</li>
            <li>Machine Learning</li>
            <li>Python Programming</li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-2">Contact</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>Email: support@pytech.com</li>
            <li>Address: Bengaluru, India</li>
          </ul>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mt-8 border-t border-gray-700 pt-4">
        © {new Date().getFullYear()} PyTech. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;