import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { supabase } from "@/lib/supabaseClient";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, CreditCard, AlertCircle } from "lucide-react";

interface Plan {
  key: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  recommended?: boolean;
}

const STUDENT_PLANS: Plan[] = [
  {
    key: "student_beginner",
    name: "Student Beginner",
    description: "Perfect for getting started",
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    features: [
      "3 pieces",
      "5 AI calls/month",
      "Basic analytics",
      "No pitch analysis",
    ],
  },
  {
    key: "student_intermediate",
    name: "Student Intermediate",
    description: "Great for serious students",
    monthlyPrice: 19.99,
    annualPrice: 199.99,
    features: [
      "10 pieces",
      "50 AI calls/month",
      "Standard analytics",
      "Pitch stability analysis",
      "Performance simulation",
    ],
    recommended: true,
  },
  {
    key: "student_advanced",
    name: "Student Advanced",
    description: "Professional-grade",
    monthlyPrice: 49.99,
    annualPrice: 499.99,
    features: [
      "100 pieces",
      "500 AI calls/month",
      "Advanced analytics",
      "Unlimited pitch analysis",
      "Performance simulation",
      "Teacher module blending",
      "Priority support",
    ],
  },
];

interface CheckoutSession {
  sessionId: string;
  url: string;
}

const TEACHER_PLANS: Plan[] = [
  {
    key: "teacher_studio",
    name: "Teacher Studio",
    description: "Teach up to 10 students",
    monthlyPrice: 29.99,
    annualPrice: 299.99,
    features: [
      "50 pieces",
      "100 AI calls/month",
      "10 students",
      "Standard analytics",
      "Pitch analysis",
    ],
  },
  {
    key: "teacher_pro",
    name: "Teacher Pro",
    description: "Expand to 50 students",
    monthlyPrice: 79.99,
    annualPrice: 799.99,
    features: [
      "500 pieces",
      "500 AI calls/month",
      "50 students",
      "Advanced analytics",
      "Pitch analysis",
      "Priority support",
    ],
    recommended: true,
  },
  {
    key: "teacher_elite",
    name: "Teacher Elite",
    description: "Enterprise-grade",
    monthlyPrice: 199.99,
    annualPrice: 1999.99,
    features: [
      "Unlimited pieces",
      "2000 AI calls/month",
      "500 students",
      "Advanced analytics",
      "Unlimited pitch analysis",
      "Priority support",
      "Custom integrations",
    ],
  },
];

interface CurrentSubscription {
  planKey: string;
  status: "active" | "trialing" | "past_due" | "canceled";
  billingCycle: "monthly" | "annual";
  renewsAt: string;
}

export default function Subscription() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [currentSubscription, setCurrentSubscription] =
    useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Fetch current subscription
    const fetchSubscription = async () => {
      try {
        const token = await getAuthToken();
        const response = await fetch("/api/subscription/current", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Handle both response formats
          const subscription = data.subscription || data;
          if (subscription) {
            setCurrentSubscription({
              planKey: subscription.plan_key,
              status: subscription.status,
              billingCycle: subscription.billing_cycle,
              renewsAt: subscription.current_period_end,
            });
          }
        } else if (response.status === 404) {
          // No active subscription
          setCurrentSubscription(null);
        }
      } catch (err) {
        console.error("Error fetching subscription:", err);
      }
    };

    fetchSubscription();
  }, [isAuthenticated, navigate]);

  const getAuthToken = async () => {
    // Get token from Supabase session
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No auth session found");
      }
      return session.access_token;
    } catch (err) {
      console.error("Failed to get auth token:", err);
      navigate("/login");
      return "";
    }
  };

  const handleCheckout = async (planKey: string) => {
    setIsLoading(true);
    setError(null);
    setCheckoutUrl(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError("Not authenticated. Please log in.");
        setIsLoading(false);
        return;
      }

      console.log("Creating checkout for plan:", planKey, billingCycle);
      const response = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_key: planKey,
          billing_cycle: billingCycle,
          client_origin: window.location.origin,
        }),
      });

      console.log("Checkout response status:", response.status);

      if (response.ok) {
        const session: CheckoutSession = await response.json();
        const sessionUrl = session.url;
        console.log("Opening checkout:", sessionUrl);

        // Try to open in new tab with window.open
        const checkoutWindow = window.open(sessionUrl, "_blank", "noopener,noreferrer");

        // If window.open was blocked (returns null), show fallback link
        if (!checkoutWindow) {
          console.warn("window.open was blocked, showing fallback link");
          setCheckoutUrl(sessionUrl);
          setError(null);
        }
      } else {
        const data = await response.json();
        const errorMsg =
          data.details || data.message || "Failed to create checkout session";
        console.error("Checkout error response:", data);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      console.error("Checkout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const response = await fetch("/api/subscription/create-portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        setError("Failed to open billing portal");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Portal error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const plans = user?.role === "teacher" ? TEACHER_PLANS : STUDENT_PLANS;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Subscription & Billing
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and upgrade your plan
          </p>
        </div>

        {/* Current Subscription */}
        {currentSubscription ? (
          <Card className="p-8 mb-10 bg-blue-50 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-serif font-semibold text-foreground mb-4">
                  Current Subscription
                </h2>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">Plan:</span>{" "}
                    <span className="text-muted-foreground capitalize">
                      {currentSubscription.planKey.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-foreground">Status:</span>{" "}
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        currentSubscription.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {currentSubscription.status}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-foreground">
                      Renews:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {new Date(currentSubscription.renewsAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>
              <Button
                onClick={handleBillingPortal}
                disabled={isLoading}
                className="gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Manage Billing
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-8 mb-10 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">
                  No Active Subscription
                </h3>
                <p className="text-sm text-yellow-800">
                  Choose a plan below to get started with VocalStudy Premium
                  features.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-10 bg-red-50 border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}

        {/* Fallback Checkout Link (if window.open is blocked) */}
        {checkoutUrl && (
          <Card className="p-6 mb-10 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Open Stripe Checkout
                </h3>
                <p className="text-sm text-blue-800">
                  A new window should have opened. If it didn't, click the button
                  below to proceed to checkout.
                </p>
              </div>
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
              >
                Continue to Checkout →
              </a>
            </div>
          </Card>
        )}

        {/* Billing Cycle Toggle */}
        <div className="mb-8 flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">
            Billing Cycle:
          </span>
          <div className="flex gap-2 bg-secondary p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-primary/10"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                billingCycle === "annual"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-primary/10"
              }`}
            >
              Annual (Save 17%)
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const price =
              billingCycle === "monthly"
                ? plan.monthlyPrice
                : plan.annualPrice;
            const isCurrentPlan = currentSubscription?.planKey === plan.key;

            return (
              <Card
                key={plan.key}
                className={`p-8 flex flex-col ${
                  plan.recommended ? "ring-2 ring-primary" : ""
                }`}
              >
                {plan.recommended && (
                  <div className="mb-4 inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold w-fit">
                    Recommended
                  </div>
                )}

                <h3 className="text-2xl font-serif font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {plan.description}
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      ${price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleCheckout(plan.key)}
                  disabled={isLoading || isCurrentPlan}
                  className="w-full"
                  variant={
                    isCurrentPlan ? "outline" : plan.recommended
                      ? "default"
                      : "outline"
                  }
                >
                  {isCurrentPlan ? "Current Plan" : "Choose Plan"}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-sm text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit and debit cards through Stripe,
                including Visa, Mastercard, American Express, and more.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-sm text-muted-foreground">
                We offer a 14-day trial period on all plans. If you're not
                satisfied, you can cancel before your trial ends.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                What happens if I cancel?
              </h3>
              <p className="text-sm text-muted-foreground">
                You'll lose access to premium features at the end of your
                billing cycle. Your data remains safe for 30 days.
              </p>
            </div>
          </div>
        </div>
      </MainContent>
    </>
  );
}
