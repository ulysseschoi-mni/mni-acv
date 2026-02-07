import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Drops from "./pages/Drops";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";

function Router() {
  return (
    <Switch>
      <Route path={"/:section"} component={Home} />
      <Route path={"/product/:id"} component={ProductDetail} />
      <Route path={"/drops"} component={Drops} />
      <Route path={"/cart"} component={Cart} />
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/payment/:orderId"} component={Payment} />
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
