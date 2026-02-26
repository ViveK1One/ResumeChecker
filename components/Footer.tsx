'use client'

import { 
  Linkedin, 
  Youtube, 
  Instagram, 
  Facebook, 
  Twitter,
  Mail,
  Phone,
  MapPin,
  Heart
} from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
                     {/* Connect with us Section */}
           <div>
            <h3 className="text-xl font-semibold mb-4">Connect with us</h3>
            <p className="text-gray-300 mb-6">on social media</p>
            
                         {/* Social Media Icons */}
             <div className="grid grid-cols-4 gap-3">
               <a 
                 href="https://www.linkedin.com/in/vivek-dudhat04/" 
                 target="_blank"
                 rel="noopener noreferrer"
                 className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-200"
                 aria-label="LinkedIn"
               >
                 <Linkedin className="w-5 h-5" />
               </a>
               <a 
                 href="https://github.com/ViveK1One" 
                 target="_blank"
                 rel="noopener noreferrer"
                 className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors duration-200"
                 aria-label="GitHub"
               >
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                 </svg>
               </a>
               <a 
                 href="mailto:theone.vivek09@gmail.com" 
                 className="w-10 h-10 bg-gray-800 hover:bg-green-500 rounded-full flex items-center justify-center transition-colors duration-200"
                 aria-label="Email"
               >
                 <Mail className="w-5 h-5" />
               </a>
               <a 
                 href="tel:017677861894" 
                 className="w-10 h-10 bg-gray-800 hover:bg-purple-500 rounded-full flex items-center justify-center transition-colors duration-200"
                 aria-label="Phone"
               >
                 <Phone className="w-5 h-5" />
               </a>
               <a 
                 href="#" 
                 className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors duration-200"
                 aria-label="Location"
               >
                 <MapPin className="w-5 h-5" />
               </a>
             </div>
             
             {/* Contact Info */}
             <div className="mt-6 space-y-2 text-sm text-gray-300">
               <p>📍 Germany</p>
               <p>📧 theone.vivek09@gmail.com</p>
               <p>📞 +49 176 77861894</p>
             </div>
          </div>

                                {/* RESUME CHECKER */}
           <div>
             <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
               Resume Checker
             </h4>
             <ul className="space-y-3">
               <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Upload Resume</a></li>
               <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Get Analysis</a></li>
               <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Download Report</a></li>
               <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Tips & Tricks</a></li>
             </ul>
           </div>

           {/* FEATURES */}
           <div>
             <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
               Features
             </h4>
             <ul className="space-y-3">
               <li><span className="text-gray-300">AI-Powered Analysis</span></li>
               <li><span className="text-gray-300">ATS Optimization</span></li>
               <li><span className="text-gray-300">Grammar Check</span></li>
               <li><span className="text-gray-300">Keyword Analysis</span></li>
               <li><span className="text-gray-300">PDF Reports</span></li>
             </ul>
           </div>

           {/* CONTACT */}
           <div>
             <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
               Contact
             </h4>
             <ul className="space-y-3">
               <li><a href="mailto:theone.vivek09@gmail.com" className="text-gray-300 hover:text-white transition-colors duration-200">Email Support</a></li>
               <li><a href="tel:017677861894" className="text-gray-300 hover:text-white transition-colors duration-200">Call Support</a></li>
               <li><a href="https://www.linkedin.com/in/vivek-dudhat04/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors duration-200">LinkedIn</a></li>
               <li><a href="https://github.com/ViveK1One" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors duration-200">GitHub</a></li>
             </ul>
           </div>
        </div>
      </div>

             {/* Bottom Section */}
       <div className="border-t border-gray-800">
         <div className="max-w-7xl mx-auto px-4 py-6">
           <div className="flex flex-col md:flex-row items-center justify-center md:justify-between space-y-4 md:space-y-0 gap-8">
             
             {/* Left Side - Location & Copyright */}
             <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2">
                 <div className="w-6 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                   <span className="text-white text-xs font-bold">DE</span>
                 </div>
                 <span className="text-gray-300 text-sm">Germany</span>
               </div>
               <span className="text-gray-400 text-sm">
                 Copyright {currentYear} - Vivek Dudhat "The ONE"
               </span>
             </div>

             {/* Right Side - Personal Branding */}
             <div className="flex items-center space-x-2 text-gray-300 text-sm">
               <span>Enterprise Solutions & Automation Expert | Database Integration Specialist</span>
             </div>
           </div>
         </div>
       </div>

       {/* Made with Love */}
       <div className="bg-gray-950 py-3">
         <div className="max-w-7xl mx-auto px-4 text-center">
           <p className="text-gray-400 text-sm">
             Made with <Heart className="inline w-4 h-4 text-red-500" /> by Vivek Dudhat "The ONE" - Software Engineer
           </p>
         </div>
       </div>

       {/* Developer Badge - At the very end */}
       {/* 
       <div className="bg-gray-900 py-6">
         <div className="max-w-7xl mx-auto px-4 flex justify-center">
           <div className="bg-white rounded-lg px-6 py-3 border border-gray-300 shadow-lg">
             <div className="text-center">
               <div className="text-gray-900 font-bold text-xl">VIVEK DUDHAT</div>
               <div className="text-gray-700 text-sm font-semibold">THE ONE</div>
               <div className="text-gray-600 text-xs">SOFTWARE ENGINEER</div>
             </div>
           </div>
         </div>
       </div>
       */}
    </footer>
  )
}
