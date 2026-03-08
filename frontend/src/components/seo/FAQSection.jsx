import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { JsonLd } from '../../hooks/useSEO';

export const FAQSchema = ({ faqs }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
  
  return <JsonLd data={schemaData} />;
};

export const FAQSection = ({ faqs, title = "Frequently Asked Questions" }) => {
  const [openIndex, setOpenIndex] = useState(null);
  
  return (
    <section className="mt-8" aria-labelledby="faq-heading">
      <FAQSchema faqs={faqs} />
      <h2 id="faq-heading" className="text-xl font-bold mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-red-400" />
        {title}
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--bg-hover)] transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="font-medium text-[var(--text-primary)]">{faq.question}</span>
              <ChevronDown 
                className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`} 
              />
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-[var(--text-muted)] text-sm">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
