import Button from "../components/Button";
import Card from "../components/Card";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Landing = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#CEE1DD] to-white">
      {/* Hero Section */}
      <section className="pt-40 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[#28363D] mb-8 leading-tight">
              Community-Powered
              <span className="block text-[#2F575D]">Safety Network</span>
            </h1>
            <p className="text-xl text-[#6D9197] mb-12 max-w-3xl mx-auto leading-relaxed">
              A map-based platform for reporting and tracking crimes, missing
              persons, dog attacks, and natural danger zones across India.
              Real-time safety awareness for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/register">
                <Button size="lg">Get Started</Button>
              </Link>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>

          {/* Hero Image/Map Placeholder */}
          <div className="mt-20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-br from-[#6D9197] to-[#2F575D] h-[500px] flex items-center justify-center">
              <div className="text-center text-white">
                <svg
                  className="w-24 h-24 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <p className="text-xl font-semibold">Interactive Safety Map</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-32 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-[#28363D] mb-4">
              Key Features
            </h2>
            <p className="text-lg text-[#6D9197]">
              Empowering communities through transparency and verified reporting
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <Card hover>
              <div className="w-12 h-12 bg-[#658B6F] rounded-lg flex items-center justify-center mb-4">
                <img
                  src="/assets/images/location.png"
                  alt="Location"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-xl font-bold text-[#28363D] mb-4">
                Location-Based Reporting
              </h3>
              <p className="text-[#6D9197] leading-relaxed">
                Pin incidents directly on an map with detailed information and
                optional proof uploads.
              </p>
            </Card>

            <Card hover>
              <div className="w-12 h-12 bg-[#658B6F] rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#28363D] mb-4">
                Community Verification
              </h3>
              <p className="text-[#6D9197] leading-relaxed">
                Nearby users can upvote or flag reports, ensuring accuracy
                through community-driven validation.
              </p>
            </Card>

            <Card hover>
              <div className="w-12 h-12 bg-[#658B6F] rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#28363D] mb-4">
                Verified Users Only
              </h3>
              <p className="text-[#6D9197] leading-relaxed">
                Government-issued ID or location-based verification ensures
                authentic reporting without exposing sensitive data.
              </p>
            </Card>

            <Card hover>
              <div className="w-12 h-12 bg-[#658B6F] rounded-lg flex items-center justify-center mb-6">
                <img
                  src="/assets/images/siren.png"
                  alt="Institution"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-xl font-bold text-[#28363D] mb-4">
                Institutional Dashboard
              </h3>
              <p className="text-[#6D9197] leading-relaxed">
                Police and municipal bodies access verified reports, take
                action, and update resolution status in real-time.
              </p>
            </Card>

            <Card hover>
              <div className="w-12 h-12 bg-[#658B6F] rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#28363D] mb-4">
                Transparency & Status Updates
              </h3>
              <p className="text-[#6D9197] leading-relaxed">
                Track resolution progress from pending to in-progress to
                resolved with community and reporter confirmation.
              </p>
            </Card>

            <Card hover>
              <div className="w-12 h-12 bg-[#658B6F] rounded-lg flex items-center justify-center mb-6">
                <img
                  src="/assets/images/magnifying-glass.png"
                  alt="Search"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-xl font-bold text-[#28363D] mb-4">
                Real-Time Safety Map
              </h3>
              <p className="text-[#6D9197] leading-relaxed">
                Tourists and residents view verified risk zones and recent
                incidents for informed safety decisions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-[#CEE1DD]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-[#28363D] mb-4">
              How It Works
            </h2>
            <p className="text-lg text-[#6D9197]">
              Simple steps to contribute to community safety
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#658B6F] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-[#28363D] mb-4">
                Register & Verify
              </h3>
              <p className="text-[#6D9197] leading-relaxed">
                Sign up and complete verification using government-issued ID or
                location-based authentication.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#658B6F] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-[#28363D] mb-4">
                Report Incidents
              </h3>
              <p className="text-[#6D9197] leading-relaxed">
                Pin locations on the map, add details, and upload optional proof
                to create verified reports.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#658B6F] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-[#28363D] mb-4">
                Track & Verify
              </h3>
              <p className="text-[#6D9197] leading-relaxed">
                Community members validate reports, and authorities take action
                with transparent status updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-32 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-20"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#28363D] mb-8">
            About SurakshaMap
          </h2>
          <p className="text-lg text-[#6D9197] mb-8 leading-relaxed">
            SurakshaMap transforms scattered safety information into a trusted,
            transparent, and location-aware public safety network. By connecting
            communities, authorities, and tourists on a single platform, we
            improve awareness, accountability, and institutional response to
            safety concerns across India.
          </p>
          <p className="text-lg text-[#6D9197] mb-12 leading-relaxed">
            Our mission is to empower every citizen to contribute to community
            safety while ensuring that reported issues receive the attention and
            action they deserve from authorized institutions.
          </p>
          <Link to="/register">
            <Button size="lg">Join Our Community</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
export default Landing;
