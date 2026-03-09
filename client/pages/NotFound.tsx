import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-8xl font-serif font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-serif font-semibold text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-muted-foreground mb-8 font-sans">
          The page you're looking for doesn't exist. It may have been moved or
          removed from the site.
        </p>
        <div className="space-x-4">
          <Button onClick={() => navigate("/")}>Return Home</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
