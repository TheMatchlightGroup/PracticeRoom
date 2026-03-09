import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Music } from "lucide-react";

export default function Repertoire() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleAddPiece = () => {
    setIsOpen(false);
    setTitle("");
    setComposer("");
    setDifficulty("Intermediate");
  };

  return (
    <>
      <Navigation />
      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
              Repertoire
            </h1>
            <p className="text-muted-foreground">
              Manage your musical pieces and practice materials
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Piece
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Piece</DialogTitle>
                <DialogDescription>
                  Enter the details of the piece you want to add to your
                  repertoire.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., O Mio Babbino Caro"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="composer">Composer</Label>
                  <Input
                    id="composer"
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="e.g., Puccini"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddPiece} className="w-full">
                  Add to Repertoire
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty State */}
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-secondary rounded-lg p-6">
              <Music className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
            No pieces added yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Start by adding a piece to generate your first AI-powered practice
            plan.
          </p>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Piece
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Piece</DialogTitle>
                <DialogDescription>
                  Enter the details of the piece you want to add to your
                  repertoire.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title2">Title</Label>
                  <Input
                    id="title2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., O Mio Babbino Caro"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="composer2">Composer</Label>
                  <Input
                    id="composer2"
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="e.g., Puccini"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty2">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty2" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddPiece} className="w-full">
                  Add to Repertoire
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </MainContent>
    </>
  );
}
