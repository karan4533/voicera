import { PageHeader } from "../components/shared/PageHeader";

export function AnalyticsPage() {
  return (
    <>
      <PageHeader 
        title="Analytics" 
        subtitle="Call performance, transcription insights, and extraction metrics" 
      />
      
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E2DDD5] bg-white py-20 mt-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FDF3E3]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C8872A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        </div>
        <h3 className="mb-2 text-lg font-bold text-[#1E1A14]">Analytics Coming Soon</h3>
        <p className="max-w-md text-center text-[13px] text-[#7A746C]">
          This module will provide deep dive metrics into your conversational AI's performance, including average handling time, intent recognition rates, and sentiment analysis.
        </p>
      </div>
    </>
  );
}
