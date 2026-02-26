'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  FileText,
  Zap,
  Award
} from 'lucide-react'

export default function TopTips() {
  const [selectedTip, setSelectedTip] = useState<number | null>(null)

  const tips = [
    {
      icon: <Target className="w-5 h-5" />,
      title: "ATS Optimization",
      description: "Ensure your resume passes through Applicant Tracking Systems with keyword optimization and formatting analysis."
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Clear Structure",
      description: "Organize with clear headings: Summary, Experience, Education, Skills."
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Action Verbs",
      description: "Start bullet points with strong action verbs like 'Led', 'Developed', 'Implemented'."
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Quantify Results",
      description: "Include specific numbers and metrics to demonstrate your impact."
    }
  ]

  const mistakes = [
    "Using generic job descriptions",
    "Including irrelevant personal information",
    "Using unprofessional email addresses",
    "Having spelling and grammar errors",
    "Using inconsistent formatting",
    "Including outdated information"
  ]

  const stats = [
    { number: "75%", label: "of resumes are rejected by ATS" },
    { number: "6", label: "seconds average time recruiters spend" },
    { number: "40%", label: "improvement with optimized keywords" },
    { number: "2", label: "pages maximum recommended length" }
  ]

  return (
    <div className="flex justify-center">
      <div className="max-w-4xl w-full space-y-8">
                           {/* Top Resume Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          whileHover={{ 
            y: -5, 
            scale: 1.02,
            transition: { duration: 0.3, type: "spring", stiffness: 300 }
          }}
                   className="group bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/20 transition-all duration-500 hover:border-sky-500/50 relative overflow-hidden"
        >
         {/* Animated background elements */}
         <motion.div
           className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           initial={{ scale: 0 }}
           whileHover={{ scale: 1 }}
           transition={{ duration: 0.5 }}
         >
           <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl"></div>
           <div className="absolute bottom-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl"></div>
         </motion.div>

                 <div className="flex items-center space-x-3 mb-6 relative z-10">
           <motion.div 
                          className="w-12 h-12 bg-sky-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-sky-500/30"
             whileHover={{ 
               scale: 1.2, 
               rotate: 5,
               transition: { duration: 0.3, type: "spring", stiffness: 400 }
             }}
             animate={{ 
               y: [0, -3, 0],
               transition: { 
                 duration: 3, 
                 repeat: Infinity, 
                 ease: "easeInOut" 
               } 
             }}
           >
                          <Lightbulb className="w-6 h-6 text-sky-300" />
           </motion.div>
           <motion.h3 
                          className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-300 group-hover:to-sky-100 transition-all duration-300"
             whileHover={{ x: 5 }}
             transition={{ duration: 0.2 }}
           >
             Top Resume Tips
           </motion.h3>
         </div>
        
        <div className="space-y-4 relative z-10">
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ x: 5, scale: 1.02 }}
              onClick={() => setSelectedTip(selectedTip === index ? null : index)}
              className={`group flex items-start space-x-3 p-4 backdrop-blur-sm rounded-xl border transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-3 hover:scale-105 ${
                selectedTip === index
                  ? 'bg-blue-900/80 border-blue-400/50 shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 border-white/20 hover:bg-blue-500/20 hover:border-blue-500/50'
              }`}
            >
              <motion.div 
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all duration-300 ${
                  selectedTip === index
                    ? 'bg-blue-800/60 border-blue-400/50'
                    : 'bg-white/10 border-white/30'
                }`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {tip.icon}
                </div>
              </motion.div>
              <div>
                <h4 className={`font-semibold text-sm mb-1 transition-colors duration-300 ${
                  selectedTip === index ? 'text-blue-100' : 'text-white group-hover:text-blue-300'
                }`}>{tip.title}</h4>
                <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                  selectedTip === index ? 'text-blue-200' : 'text-white/80 group-hover:text-gray-200'
                }`}>{tip.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

             {/* Common Mistakes */}
       <motion.div
         initial={{ opacity: 0, y: 20, scale: 0.9 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
         whileHover={{ 
           y: -5, 
           scale: 1.02,
           transition: { duration: 0.3, type: "spring", stiffness: 300 }
         }}
                  className="group bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:border-orange-500/50 relative overflow-hidden"
       >
                 {/* Animated background elements */}
         <motion.div
           className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           initial={{ scale: 0 }}
           whileHover={{ scale: 1 }}
           transition={{ duration: 0.5 }}
         >
           <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
           <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
         </motion.div>

                 <div className="flex items-center space-x-3 mb-6 relative z-10">
           <motion.div 
                          className="w-12 h-12 bg-orange-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-orange-500/30"
             whileHover={{ 
               scale: 1.2, 
               rotate: 5,
               transition: { duration: 0.3, type: "spring", stiffness: 400 }
             }}
             animate={{ 
               y: [0, -3, 0],
               transition: { 
                 duration: 3, 
                 repeat: Infinity, 
                 ease: "easeInOut" 
               } 
             }}
           >
                          <AlertTriangle className="w-6 h-6 text-orange-300" />
           </motion.div>
           <motion.h3 
                          className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-300 group-hover:to-orange-100 transition-all duration-300"
             whileHover={{ x: 5 }}
             transition={{ duration: 0.2 }}
           >
             Common Mistakes
           </motion.h3>
         </div>
        
                 <div className="space-y-3 relative z-10">
           {mistakes.map((mistake, index) => (
             <motion.div
               key={index}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.4 + index * 0.05 }}
               whileHover={{ x: 5 }}
                              className="flex items-start space-x-3 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-orange-500/20 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300"
             >
               <motion.div 
                                  className="w-3 h-3 bg-orange-400 rounded-full mt-2 flex-shrink-0"
                 whileHover={{ scale: 1.5 }}
                 transition={{ duration: 0.2 }}
               ></motion.div>
                              <p className="text-white/80 text-sm leading-relaxed">{mistake}</p>
             </motion.div>
           ))}
         </div>
      </motion.div>

             {/* Did You Know */}
       <motion.div
         initial={{ opacity: 0, y: 20, scale: 0.9 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
         whileHover={{ 
           y: -5, 
           scale: 1.02,
           transition: { duration: 0.3, type: "spring", stiffness: 300 }
         }}
                  className="group bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-green-500/30 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:border-green-500/50 relative overflow-hidden"
       >
        {/* Animated background elements */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          initial={{ scale: 0 }}
          whileHover={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
        </motion.div>

        <div className="flex items-center space-x-3 mb-6 relative z-10">
          <motion.div 
                         className="w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-500/30"
            whileHover={{ 
              scale: 1.2, 
              rotate: 5,
              transition: { duration: 0.3, type: "spring", stiffness: 400 }
            }}
            animate={{ 
              y: [0, -3, 0],
              transition: { 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              } 
            }}
          >
                         <Award className="w-6 h-6 text-green-300" />
          </motion.div>
          <motion.h3 
                         className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-green-300 group-hover:to-green-100 transition-all duration-300"
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
          >
            Did You Know?
          </motion.h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -3 }}
                             className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-green-500/20 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300"
            >
              <motion.div 
                                 className="text-2xl font-bold text-white mb-1"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {stat.number}
              </motion.div>
                             <div className="text-white/80 text-xs leading-tight">{stat.label}</div>
            </motion.div>
          ))}
                 </div>
       </motion.div>
       </div>
     </div>
   )
 }
