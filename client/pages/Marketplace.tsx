import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context-supabase";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MapPin } from "lucide-react";

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const teachers = [
    {
      id: 1,
      name: "Dr. Maria Santos",
      instrument: "Voice",
      methods: ["Vaccai", "Lamperti"],
      experience: 15,
      rate: 75,
      rating: 4.9,
      image: "M",
    },
    {
      id: 2,
      name: "James Chen",
      instrument: "Piano",
      methods: ["Custom", "Czerny"],
      experience: 22,
      rate: 85,
      rating: 4.8,
      image: "J",
    },
    {
      id: 3,
      name: "Sophie Durand",
      instrument: "Voice",
      methods: ["Bel Canto", "Garcia"],
      experience: 10,
      rate: 60,
      rating: 4.7,
      image: "S",
    },
  ];

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.methods.some((m) =>
        m.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesInstrument =
      instrumentFilter === "all" || teacher.instrument === instrumentFilter;
    const matchesMethod =
      methodFilter === "all" ||
      teacher.methods.some((m) => m === methodFilter);

    return matchesSearch && matchesInstrument && matchesMethod;
  });

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Marketplace
          </h1>
          <p className="text-muted-foreground">
            Connect with experienced teachers to enhance your learning
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Search
              </label>
              <Input
                placeholder="Teacher name or method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Instrument
              </label>
              <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instruments</SelectItem>
                  <SelectItem value="Voice">Voice</SelectItem>
                  <SelectItem value="Piano">Piano</SelectItem>
                  <SelectItem value="Violin">Violin</SelectItem>
                  <SelectItem value="Cello">Cello</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Method
              </label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="Vaccai">Vaccai</SelectItem>
                  <SelectItem value="Lamperti">Lamperti</SelectItem>
                  <SelectItem value="Garcia">Garcia</SelectItem>
                  <SelectItem value="Bel Canto">Bel Canto</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Price Range
              </label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  <SelectItem value="0-50">Under $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100+">$100+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Avatar */}
              <div className="h-24 bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-2xl font-serif font-semibold text-primary">
                  {teacher.image}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-serif font-semibold text-foreground mb-1">
                  {teacher.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    {teacher.rating}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Instrument</span>
                    <span className="font-medium text-foreground">
                      {teacher.instrument}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-medium text-foreground">
                      {teacher.experience} years
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium text-foreground">
                      ${teacher.rate}/hr
                    </span>
                  </div>
                </div>

                {/* Methods */}
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-2">Methods</p>
                  <div className="flex flex-wrap gap-2">
                    {teacher.methods.map((method) => (
                      <span
                        key={method}
                        className="px-2 py-1 bg-secondary text-xs font-medium text-primary rounded"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <Button className="w-full">Book Lesson</Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredTeachers.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No teachers found matching your criteria</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setInstrumentFilter("all");
                setMethodFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </Card>
        )}
      </MainContent>
    </>
  );
}
