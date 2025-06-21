import { Loader2, Home, Calculator, CreditCard, TrendingUp } from "lucide-react"

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main loading container */}
      <div className="text-center space-y-8 p-8">
        {/* Animated home equipment icons */}
        <div className="flex justify-center space-x-8 mb-8">
          <div className="animate-bounce" style={{ animationDelay: '0ms' }}>
            <Home className="h-12 w-12 text-blue-600" />
          </div>
          <div className="animate-bounce" style={{ animationDelay: '150ms' }}>
            <Calculator className="h-12 w-12 text-green-600" />
          </div>
          <div className="animate-bounce" style={{ animationDelay: '300ms' }}>
            <CreditCard className="h-12 w-12 text-purple-600" />
          </div>
          <div className="animate-bounce" style={{ animationDelay: '450ms' }}>
            <TrendingUp className="h-12 w-12 text-orange-600" />
          </div>
        </div>

        {/* Welcome message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome to Household Expenses
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Setting up your financial dashboard...
          </p>
        </div>

        {/* Loading spinner */}
        <div className="flex justify-center mt-8">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping"></div>
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 opacity-20">
        <Home className="h-16 w-16 text-blue-400" />
      </div>
      <div className="absolute top-20 right-20 opacity-20">
        <Calculator className="h-12 w-12 text-green-400" />
      </div>
      <div className="absolute bottom-20 left-20 opacity-20">
        <CreditCard className="h-14 w-14 text-purple-400" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-20">
        <TrendingUp className="h-16 w-16 text-orange-400" />
      </div>
    </div>
  )
}
