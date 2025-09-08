"use client";
import React from "react";





export default function HomePage() {

  return (
    <main className="w-full">
      

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Find Your Next Event?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of event-goers who trust our platform to discover amazing experiences.
          </p>
          <button 

            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Explore All Events
          </button>
        </div>
      </section>
    </main>
  );
}