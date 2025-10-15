import React from 'react';

// --- Icon Components ---
const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.25 6.5 1.75 1.75 0 016.5 8.25zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.62 1.62 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
  </svg>
);

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
  </svg>
);

const AboutAuthor = () => {
  return (
    <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-700 max-w-2xl mx-auto text-center"> {/* Centered content */}
      <h1 className="text-4xl font-display font-bold text-white">
        Hi, I'm Krzysztof Szudy
      </h1>
      <p className="mt-4 text-lg text-gray-300">
        I'm a data engineering student at Gdańsk University of Technology. I created this project to apply my technical skills to the world of finance, a field that has always fascinated me.
      </p>
      <p className="mt-2 text-gray-400">
        This tool is my exploration of quantitative, rules-based investment strategies.
      </p>
      
      <div className="flex justify-center items-center space-x-6 mt-6"> {/* Centered social links */}
          <a 
              href="https://www.linkedin.com/in/krzysztof-szudy-744171253" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
              aria-label="LinkedIn Profile"
          >
              <LinkedInIcon />
          </a>
          <a 
              href="https://github.com/kizerek321/gem-portfolio-tracker/tree/main" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors duration-300"
              aria-label="GitHub Profile"
          >
              <GitHubIcon />
          </a>
      </div>
    </div>
  );
};

export default AboutAuthor;
