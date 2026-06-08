import React, { useState } from "react";
import { Mail, Check, AlertCircle, Sparkles, Send, ShieldCheck, FileText, Info, Scale } from "lucide-react";

interface CompliancePagesProps {
  section: "about" | "privacy" | "terms" | "disclaimer" | "contact_page";
  setTab: (tab: string) => void;
  triggerNotification: (type: "copy" | "share" | "success" | "info", message: string, title?: string) => void;
}

export default function CompliancePages({ section, setTab, triggerNotification }: CompliancePagesProps) {
  // Contact Form Local States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; subject?: string; message?: string }>({});

  const validateForm = () => {
    const activeErrors: typeof errors = {};
    if (!name.trim()) activeErrors.name = "Full Name is required.";
    else if (name.trim().length < 3) activeErrors.name = "Name must be at least 3 characters long.";

    if (!email.trim()) activeErrors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) activeErrors.email = "Please enter a valid email format.";

    if (!subject.trim()) activeErrors.subject = "Subject line is required.";
    else if (subject.trim().length < 4) activeErrors.subject = "Subject must be at least 4 characters.";

    if (!message.trim()) activeErrors.message = "Message content is required.";
    else if (message.trim().length < 20) activeErrors.message = "Message must be at least 20 characters for clear processing.";

    setErrors(activeErrors);
    return Object.keys(activeErrors).length === 0;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      triggerNotification("info", "Please fix form validation errors before sending.", "Notice");
      return;
    }

    setIsSubmitting(true);

    // Simulate sending with high-integrity feedback state
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      triggerNotification("success", "Your compliance message has been dispatched successfully!", "Inquiry Sent");
      
      // Reset after success
      setTimeout(() => {
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setIsSuccess(false);
      }, 5000);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-[#E2E8F0] font-sans">
      <div className="bg-[#1E293B]/80 border border-violet-500/10 rounded-3xl p-6 md:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.6)] backdrop-blur-md relative overflow-hidden">
        
        {/* Soft background glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Visual Header Identity */}
        {section === "about" && (
          <div className="mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 mb-4 font-semibold shadow-lg">
              <Info className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">About Us</h1>
            <span className="text-xs font-mono text-cyan-400 block mt-2">https://shubhprompt.online &bull; Verified AI Prompt Marketplace</span>
          </div>
        )}

        {section === "privacy" && (
          <div className="mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 mb-4 font-semibold shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">Privacy Policy</h1>
            <span className="text-xs font-mono text-emerald-400 block mt-2">Effective Date: June 2026 &bull; AdSense Compliant Standards</span>
          </div>
        )}

        {section === "terms" && (
          <div className="mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 mb-4 font-semibold shadow-lg">
              <Scale className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">Terms and Conditions</h1>
            <span className="text-xs font-mono text-indigo-400 block mt-2">Usage Agreement &bull; Intellectual Property Disclosures</span>
          </div>
        )}

        {section === "disclaimer" && (
          <div className="mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-amber-400 mb-4 font-semibold shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">Disclaimer</h1>
            <span className="text-xs font-mono text-amber-400 block mt-2">Third-Party Affiliations &bull; Information Reliability Assurances</span>
          </div>
        )}

        {section === "contact_page" && (
          <div className="mb-8 text-center max-w-xl mx-auto">
            <div className="inline-flex p-3 rounded-2xl bg-violet-500/10 border border-violet-400/20 text-violet-400 mb-4 font-semibold shadow-lg">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">Contact Us</h1>
            <p className="text-xs text-slate-400 font-sans leading-relaxed mt-2">
              Have a question about a specific prompt? Found a bug on our site? Or do you want to collaborate with us? We would love to hear from you! Please fill out the form below or reach out to us directly via email.
            </p>
          </div>
        )}

        {/* --- DEDICATED MARKDOWN & COMPLIANCE TEXT BLOCKS (EXACT SPEC CONTENT) --- */}
        <div className="prose prose-invert max-w-none text-slate-300 text-sm md:text-base leading-relaxed space-y-6">
          
          {section === "about" && (
            <div className="space-y-6">
              <p>
                Welcome to Shubh Prompt!
              </p>
              <p>
                At Shubh Prompt (
                <a href="https://shubhprompt.online" target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-semibold underline hover:text-cyan-300">
                  https://shubhprompt.online
                </a>
                ), we are passionate about the future of Artificial Intelligence and Generative Art. Our mission is to bridge the gap between complex AI technologies and creative minds. Whether you are a digital artist, designer, content creator, or tech enthusiast, we provide high-quality, ready-to-use text prompts for popular AI tools like Midjourney, ChatGPT, Gemini, and Bing Image Creator.
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                Who We Are:
              </h2>
              <p>
                Founded by Shubh, a dedicated AI Prompt Engineer and tech enthusiast, Shubh Prompt was created to solve a common problem: finding the exact keywords to get stunning, highly realistic AI-generated results. We spend hours testing, tweaking, and optimizing words, parameters, and aspect ratios so that you don't have to waste your computational credits or time.
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                What We Offer:
              </h2>
              <ul className="list-disc list-inside space-y-2.5 pl-2">
                <li>
                  <strong className="text-white">Expertly Crafted AI Art Prompts:</strong> Hand-tested copy-paste prompts for beautiful 3D designs, photorealistic portraits, and marketing banners.
                </li>
                <li>
                  <strong className="text-white">Clear AI Tool Guides:</strong> Step-by-step tutorials breaking down complex parameters, aspect ratios, and styles.
                </li>
                <li>
                  <strong className="text-white">100% Free Resources:</strong> High-quality prompt libraries accessible to everyone completely free of charge.
                </li>
              </ul>

              <p className="mt-8 pt-4 border-t border-violet-500/10 text-xs text-slate-400">
                For any questions, business inquiries, or support, please feel free to reach out to us at:{" "}
                <a href="mailto:shubhprompt@gmail.com" className="text-cyan-400 font-mono underline hover:text-cyan-300 font-bold">
                  shubhprompt@gmail.com
                </a>
              </p>
            </div>
          )}

          {section === "privacy" && (
            <div className="space-y-6">
              <p>
                Privacy Policy for Shubh Prompt
              </p>
              <p>
                At Shubh Prompt, accessible from {" "}
                <a href="https://shubhprompt.online" target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-semibold underline hover:text-cyan-300">
                  https://shubhprompt.online
                </a>
                , one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Shubh Prompt and how we use it.
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                Log Files:
              </h2>
              <p>
                Shubh Prompt follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                Cookies and Web Beacons:
              </h2>
              <p>
                Like any other website, Shubh Prompt uses "cookies". These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                Google DoubleClick DART Cookie:
              </h2>
              <p>
                Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL –{" "}
                <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 font-mono">
                  https://google.com
                </a>
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                Our Advertising Partners:
              </h2>
              <p>
                Some of advertisers on our site may use cookies and web beacons. Our advertising partners include Google AdSense. Each of our advertising partners has their own Privacy Policy for their policies on user data.
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                Third-Party Privacy Policies:
              </h2>
              <p>
                Shubh Prompt's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                Consent:
              </h2>
              <p>
                By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
              </p>
            </div>
          )}

          {section === "terms" && (
            <div className="space-y-6">
              <p>
                Terms and Conditions
              </p>
              <p>
                Welcome to Shubh Prompt!
              </p>
              <p>
                These terms and conditions outline the rules and regulations for the use of Shubh Prompt's Website, located at{" "}
                <a href="https://shubhprompt.online" target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-semibold underline hover:text-cyan-300">
                  https://shubhprompt.online
                </a>
                . By accessing this website, we assume you accept these terms and conditions. Do not continue to use Shubh Prompt if you do not agree to take all of the terms and conditions stated on this page.
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                License to Use Prompts:
              </h2>
              <p>
                Unless otherwise stated, Shubh Prompt owns the intellectual property rights for all text prompts published on this website. You may view, copy, and use these prompts for generating personal or commercial artwork on third-party platforms (like Midjourney, ChatGPT, etc.). However, you must not republish or resell the exact text prompt compilation or database on other websites.
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                Limitation of Liability:
              </h2>
              <p>
                We do not warrant that the information on this website is correct, complete, or accurate; nor do we promise to ensure that the website remains available or that the material on the website is kept up to date.
              </p>
            </div>
          )}

          {section === "disclaimer" && (
            <div className="space-y-6">
              <p>
                Disclaimer for Shubh Prompt
              </p>
              <p>
                All the information on this website -{" "}
                <a href="https://shubhprompt.online" target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-semibold underline hover:text-cyan-300 font-mono">
                  https://shubhprompt.online
                </a>
                {" "}- is published in good faith and for general information and educational purposes only. Shubh Prompt does not make any warranties about the completeness, reliability, and accuracy of this information. Any action you take upon the information you find on this website is strictly at your own risk.
              </p>

              <h2 className="text-lg md:text-xl font-bold font-sans text-white border-b border-violet-500/10 pb-2 mt-8">
                Third-Party Tools Affiliation:
              </h2>
              <p>
                Shubh Prompt is an independent resource providing prompt engineering tips and text strings. We are NOT officially affiliated, associated, authorized, endorsed by, or in any way officially connected with Midjourney, OpenAI (ChatGPT), Google (Gemini), Microsoft, or any of their subsidiaries or affiliates. The names Midjourney, ChatGPT, Gemini, and Bing Image Creator, as well as related names, marks, emblems, and images, are registered trademarks of their respective owners.
              </p>
            </div>
          )}

          {section === "contact_page" && (
            <div className="mt-8 max-w-xl mx-auto">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-violet-500/5 text-center mb-6">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 block mb-1">Direct Operational Email</span>
                <a href="mailto:shubhprompt@gmail.com" className="text-sm font-semibold font-mono text-cyan-400 hover:underline hover:text-cyan-300">
                  shubhprompt@gmail.com
                </a>
              </div>

              {/* Strict Validator HTML5 Contact Form */}
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact-form-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className={`w-full bg-[#1E293B] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-500 transition duration-200 ${
                      errors.name ? "border-rose-500" : "border-violet-500/20"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1.5 font-sans">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contact-form-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@company.com"
                    className={`w-full bg-[#1E293B] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-500 transition duration-200 ${
                      errors.email ? "border-rose-500" : "border-violet-500/20"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1.5 font-sans">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact-form-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Midjourney Licensing Inquiry"
                    className={`w-full bg-[#1E293B] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-500 transition duration-200 ${
                      errors.subject ? "border-rose-500" : "border-violet-500/20"
                    }`}
                  />
                  {errors.subject && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1.5 font-sans">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Message Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="contact-form-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Write your specifications or collaboration requests in detail here..."
                    className={`w-full bg-[#1E293B] border rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-500 transition duration-200 ${
                      errors.message ? "border-rose-500" : "border-violet-500/20"
                    }`}
                  />
                  {errors.message && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1.5 font-sans">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  id="contact-form-submit-trigger"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-sans text-xs font-bold rounded-xl tracking-widest uppercase transition duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Auditing Parameters...
                    </span>
                  ) : isSuccess ? (
                    <span className="flex items-center gap-2 text-emerald-300">
                      <Check className="w-4 h-4 animate-bounce" />
                      Message Dispatched! Thank You.
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Secure Message
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Back Link Context */}
        <div className="mt-10 border-t border-violet-500/10 pt-6 flex items-center justify-between text-xs font-mono">
          <button
            onClick={() => setTab("home")}
            className="text-cyan-400 hover:text-white hover:underline transition"
          >
            &larr; Back to Home Dashboard
          </button>
          
          <span className="text-gray-500">shubhprompt.online compliance</span>
        </div>

      </div>
    </div>
  );
}
