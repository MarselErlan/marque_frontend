"use client"

import { useState, useEffect } from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export type Market = "kg" | "us"

interface MarketConfig {
  flag: string
  name: string
  currency: string
  language: string
  dbLabel: string
  gradient: string
  textColor: string
}

const marketConfigs: Record<Market, MarketConfig> = {
  kg: {
    flag: "🇰🇬",
    name: "КЫРГЫЗСТАН",
    currency: "сом KGS",
    language: "Русский",
    dbLabel: "KG DB",
    gradient: "from-green-500 to-green-600",
    textColor: "text-green-600",
  },
  us: {
    flag: "🇺🇸",
    name: "UNITED STATES",
    currency: "$ USD",
    language: "English",
    dbLabel: "US DB",
    gradient: "from-blue-500 to-blue-600",
    textColor: "text-blue-600",
  },
}

interface MarketIndicatorProps {
  currentMarket: Market
  onMarketChange: (market: Market) => void
  showSwitcher?: boolean
}

export function MarketIndicator({
  currentMarket,
  onMarketChange,
  showSwitcher = true,
}: MarketIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState<Market>(currentMarket)
  const config = marketConfigs[currentMarket]

  useEffect(() => {
    setSelectedMarket(currentMarket)
  }, [currentMarket])

  const handleMarketChange = () => {
    onMarketChange(selectedMarket)
    setIsOpen(false)
  }

  return (
    <>
      {/* Market Indicator Badge */}
      <div
        className={`relative bg-gradient-to-r ${config.gradient} rounded-xl shadow-lg p-3 cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5`}
        onClick={() => showSwitcher && setIsOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl drop-shadow-md">{config.flag}</span>
            <div>
              <div className="text-white font-bold text-sm tracking-wide drop-shadow-sm">
                {config.name}
              </div>
              <div className="text-white/95 text-xs font-medium drop-shadow-sm">
                {config.currency} • {config.language}
              </div>
            </div>
          </div>
          <div className="bg-white/25 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="text-white font-bold text-xs tracking-wider drop-shadow-sm">
              {config.dbLabel}
            </span>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-2 pt-2 border-t border-white/20 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-300" />
          <span className="text-white/95 text-xs font-semibold drop-shadow-sm">
            Подключено
          </span>
        </div>

        {/* Switcher Icon */}
        {showSwitcher && (
          <div className="absolute top-2 right-2">
            <Globe className="w-4 h-4 text-white/80" />
          </div>
        )}
      </div>

      {/* Market Switcher Dialog */}
      {showSwitcher && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Выбрать рынок</DialogTitle>
              <DialogDescription>
                Выберите рынок для управления заказами и данными
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <RadioGroup value={selectedMarket} onValueChange={(value) => setSelectedMarket(value as Market)}>
                {/* KG Market Option */}
                <div
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMarket === "kg"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedMarket("kg")}
                >
                  <RadioGroupItem value="kg" id="kg" />
                  <Label htmlFor="kg" className="flex items-center space-x-3 cursor-pointer flex-1">
                    <span className="text-2xl">{marketConfigs.kg.flag}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{marketConfigs.kg.name}</div>
                      <div className="text-sm text-gray-500">
                        {marketConfigs.kg.currency} • {marketConfigs.kg.language}
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                      {marketConfigs.kg.dbLabel}
                    </div>
                  </Label>
                </div>

                {/* US Market Option */}
                <div
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMarket === "us"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedMarket("us")}
                >
                  <RadioGroupItem value="us" id="us" />
                  <Label htmlFor="us" className="flex items-center space-x-3 cursor-pointer flex-1">
                    <span className="text-2xl">{marketConfigs.us.flag}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{marketConfigs.us.name}</div>
                      <div className="text-sm text-gray-500">
                        {marketConfigs.us.currency} • {marketConfigs.us.language}
                      </div>
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                      {marketConfigs.us.dbLabel}
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <div className="pt-2 space-y-2">
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={handleMarketChange}
                  disabled={selectedMarket === currentMarket}
                >
                  {selectedMarket === currentMarket ? "Текущий рынок" : "Переключить рынок"}
                </Button>
                {selectedMarket !== currentMarket && (
                  <p className="text-xs text-center text-amber-600 font-medium">
                    ⚠️ Переключение рынка обновит все данные заказов
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// Compact version for mobile header
export function MarketIndicatorCompact({ currentMarket }: { currentMarket: Market }) {
  const config = marketConfigs[currentMarket]

  return (
    <div className={`bg-gradient-to-r ${config.gradient} rounded-lg px-2 py-1 shadow-md`}>
      <div className="flex items-center space-x-1.5">
        <span className="text-sm">{config.flag}</span>
        <span className="text-white font-bold text-xs tracking-wide">{config.dbLabel}</span>
        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
      </div>
    </div>
  )
}

