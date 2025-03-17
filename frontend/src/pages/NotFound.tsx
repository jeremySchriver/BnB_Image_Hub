
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import Button from "@/components/Button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-24 h-24 mx-auto flex items-center justify-center bg-secondary/50 rounded-full">
          <span className="text-5xl font-bold tracking-tighter">404</span>
        </div>
        <h1 className="text-3xl font-bold mt-6">Page not found</h1>
        <p className="text-muted-foreground mt-3 mb-8">
          Sorry, the page you were looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button icon={<Home className="h-4 w-4" />}>
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
