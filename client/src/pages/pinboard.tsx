import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  StickyNote, 
  BarChart3, 
  CheckSquare,
  Move,
  Trash2,
  Palette,
  Save,
  X
} from "lucide-react";
import type { 
  PinboardPageWithItems, 
  PinboardItemWithDetails,
  InsertPinboardPage,
  InsertPinboardItem,
  InsertPinboardNote,
  InsertPinboardPoll,
  TodoWithDetails
} from "@shared/schema";

const COLORS = {
  yellow: "#ffeb3b",
  blue: "#2196f3",
  green: "#4caf50",
  pink: "#e91e63",
  orange: "#ff9800",
  purple: "#9c27b0"
};

interface DragState {
  isDragging: boolean;
  itemId: number | null;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

export default function Pinboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    itemId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [createMenuPosition, setCreateMenuPosition] = useState({ x: 0, y: 0 });
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageColor, setPageColor] = useState("#ffffff");

  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch pages
  const { data: pages = [], isLoading } = useQuery<PinboardPageWithItems[]>({
    queryKey: ["/api/pinboard/pages"],
  });

  // Get current page data
  const currentPageData = pages.find(p => p.pageNumber === currentPage);

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (page: InsertPinboardPage) => {
      return apiRequest("POST", "/api/pinboard/pages", page);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pinboard/pages"] });
    },
  });

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, page }: { id: number; page: Partial<InsertPinboardPage> }) => {
      return apiRequest("PUT", `/api/pinboard/pages/${id}`, page);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pinboard/pages"] });
    },
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (item: InsertPinboardItem) => {
      return apiRequest("POST", "/api/pinboard/items", item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pinboard/pages"] });
    },
  });

  // Update item position
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, item }: { id: number; item: Partial<InsertPinboardItem> }) => {
      return apiRequest("PUT", `/api/pinboard/items/${id}`, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pinboard/pages"] });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/pinboard/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pinboard/pages"] });
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (note: InsertPinboardNote) => {
      return apiRequest("POST", "/api/pinboard/notes", note);
    },
  });

  // Create poll mutation
  const createPollMutation = useMutation({
    mutationFn: async (poll: InsertPinboardPoll) => {
      return apiRequest("POST", "/api/pinboard/polls", poll);
    },
  });

  // Fetch available todos for adding to pinboard
  const { data: availableTodos = [] } = useQuery<TodoWithDetails[]>({
    queryKey: ["/api/todos"],
  });

  // Handle page navigation
  const goToPage = (pageNumber: number) => {
    // Create page if it doesn't exist
    if (!pages.find(p => p.pageNumber === pageNumber)) {
      createPageMutation.mutate({
        pageNumber,
        title: `Page ${pageNumber}`,
        backgroundColor: "#ffffff"
      });
    }
    setCurrentPage(pageNumber);
  };

  // Handle right-click to show create menu
  const handleCanvasRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCreateMenuPosition({ x: e.clientX, y: e.clientY });
    setShowCreateMenu(true);
  };

  // Handle double-click to create note
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!currentPageData) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    createNote(x, y);
  };

  // Create different types of items
  const createNote = async (x: number, y: number, content = "New note") => {
    if (!currentPageData) return;

    try {
      const note = await createNoteMutation.mutateAsync({
        content,
        backgroundColor: COLORS.yellow,
        textColor: "#000000"
      });

      await createItemMutation.mutateAsync({
        pageId: currentPageData.id,
        itemType: "note",
        itemId: note.id,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: 200,
        height: 150,
        zIndex: 0
      });
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const createPoll = async (x: number, y: number) => {
    if (!currentPageData) return;

    try {
      const poll = await createPollMutation.mutateAsync({
        question: "What do you think?",
        options: ["Option 1", "Option 2", "Option 3"],
        allowMultipleVotes: false,
        isAnonymous: false
      });

      await createItemMutation.mutateAsync({
        pageId: currentPageData.id,
        itemType: "poll",
        itemId: poll.id,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: 300,
        height: 200,
        zIndex: 0
      });
    } catch (error) {
      console.error("Error creating poll:", error);
    }
  };

  const addTodoToPinboard = async (x: number, y: number, todoId: number) => {
    if (!currentPageData) return;

    try {
      await createItemMutation.mutateAsync({
        pageId: currentPageData.id,
        itemType: "todo",
        itemId: todoId,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: 250,
        height: 180,
        zIndex: 0
      });
    } catch (error) {
      console.error("Error adding todo to pinboard:", error);
    }
  };

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent, item: PinboardItemWithDetails) => {
    e.preventDefault();
    setDragState({
      isDragging: true,
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y
    });
  };

  const handleMouseMove = (e: any) => {
    if (!dragState.isDragging || !dragState.itemId) return;

    e.preventDefault();
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    const newX = Math.max(0, dragState.initialX + deltaX);
    const newY = Math.max(0, dragState.initialY + deltaY);

    // Update item position in real-time by finding and updating the DOM element
    const itemElement = document.getElementById(`pinboard-item-${dragState.itemId}`);
    if (itemElement) {
      itemElement.style.left = `${newX}px`;
      itemElement.style.top = `${newY}px`;
    }
  };

  const handleMouseUp = () => {
    if (!dragState.isDragging || !dragState.itemId) return;

    const item = currentPageData?.items.find(i => i.id === dragState.itemId);
    if (item) {
      const itemElement = document.getElementById(`pinboard-item-${dragState.itemId}`);
      if (itemElement) {
        const newX = parseInt(itemElement.style.left);
        const newY = parseInt(itemElement.style.top);
        
        updateItemMutation.mutate({
          id: dragState.itemId,
          item: { x: newX, y: newY }
        });
      }
    }

    setDragState({
      isDragging: false,
      itemId: null,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0
    });
  };

  // Close create menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setShowCreateMenu(false);
    if (showCreateMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showCreateMenu]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading pinboard...</p>
        </div>
      </div>
    );
  }

  const maxPage = Math.max(1, ...pages.map(p => p.pageNumber), currentPage);

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Pinboard</h1>
          {editingPage === currentPageData?.id ? (
            <div className="flex items-center space-x-2">
              <Input
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-40"
                placeholder="Page title"
              />
              <div className="flex space-x-1">
                {Object.entries(COLORS).map(([name, color]) => (
                  <button
                    key={name}
                    className={`w-6 h-6 rounded border-2 ${
                      pageColor === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPageColor(color)}
                  />
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (currentPageData) {
                    updatePageMutation.mutate({
                      id: currentPageData.id,
                      page: { title: pageTitle, backgroundColor: pageColor }
                    });
                  }
                  setEditingPage(null);
                }}
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingPage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentPageData) {
                  setPageTitle(currentPageData.title);
                  setPageColor(currentPageData.backgroundColor || "#ffffff");
                  setEditingPage(currentPageData.id);
                }
              }}
            >
              <Palette className="w-4 h-4 mr-2" />
              Customize Page
            </Button>
          )}
        </div>

        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Page</span>
            <Badge variant="outline" className="px-3">
              {currentPage}
            </Badge>
            <span className="text-sm text-gray-600">of {maxPage}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-gray-500">
          Double-click to add note • Right-click for menu • Drag to move items
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="relative w-full h-full overflow-hidden cursor-crosshair"
        style={{ 
          backgroundColor: currentPageData?.backgroundColor || "#ffffff",
          backgroundImage: "radial-gradient(circle, #00000008 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
        onContextMenu={handleCanvasRightClick}
        onDoubleClick={handleCanvasDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Render pinboard items */}
        {currentPageData?.items.map((item) => (
          <PinboardItemComponent
            key={item.id}
            item={item}
            onMouseDown={handleMouseDown}
            onDelete={() => deleteItemMutation.mutate(item.id)}
            isEditing={editingNote === item.id}
            onEdit={() => setEditingNote(item.id)}
            onSaveEdit={() => setEditingNote(null)}
          />
        ))}

        {/* Create Menu */}
        {showCreateMenu && (
          <div
            className="absolute z-50 bg-white border rounded-lg shadow-lg p-2 min-w-48"
            style={{
              left: createMenuPosition.x,
              top: createMenuPosition.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  createNote(createMenuPosition.x - 100, createMenuPosition.y - 75);
                  setShowCreateMenu(false);
                }}
              >
                <StickyNote className="w-4 h-4 mr-2" />
                Add Note
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  createPoll(createMenuPosition.x - 150, createMenuPosition.y - 100);
                  setShowCreateMenu(false);
                }}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Add Poll
              </Button>

              {availableTodos.length > 0 && (
                <div className="border-t pt-1 mt-1">
                  <div className="text-xs text-gray-500 px-3 py-1">Add Todo:</div>
                  {availableTodos.slice(0, 5).map((todo) => (
                    <Button
                      key={todo.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        addTodoToPinboard(createMenuPosition.x - 125, createMenuPosition.y - 90, todo.id);
                        setShowCreateMenu(false);
                      }}
                    >
                      <CheckSquare className="w-3 h-3 mr-2" />
                      {todo.title.substring(0, 30)}...
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual pinboard item component
function PinboardItemComponent({
  item,
  onMouseDown,
  onDelete,
  isEditing,
  onEdit,
  onSaveEdit,
}: {
  item: PinboardItemWithDetails;
  onMouseDown: (e: React.MouseEvent, item: PinboardItemWithDetails) => void;
  onDelete: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onSaveEdit: () => void;
}) {
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (isEditing && item.note) {
      setEditContent(item.note.content);
    }
  }, [isEditing, item.note]);

  const handleEditSave = () => {
    // Update note content logic would go here
    onSaveEdit();
  };

  return (
    <div
      id={`pinboard-item-${item.id}`}
      className="absolute group cursor-move select-none"
      style={{
        left: item.x,
        top: item.y,
        width: item.width || 200,
        height: item.height || 150,
        zIndex: item.zIndex || 0,
      }}
      onMouseDown={(e) => onMouseDown(e, item)}
    >
      <Card className="h-full shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-blue-300">
        <CardContent className="p-3 h-full relative">
          {/* Delete button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>

          {/* Move indicator */}
          <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Move className="w-3 h-3 text-gray-400" />
          </div>

          {/* Render content based on item type */}
          {item.itemType === "note" && item.note && (
            <div 
              className="h-full w-full rounded"
              style={{ 
                backgroundColor: item.note.backgroundColor,
                color: item.note.textColor 
              }}
            >
              {isEditing ? (
                <div className="h-full flex flex-col space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 resize-none border-none bg-transparent"
                    style={{ color: item.note.textColor }}
                  />
                  <div className="flex space-x-1">
                    <Button size="sm" onClick={handleEditSave}>
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={onSaveEdit}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="h-full w-full p-2 cursor-text"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  {item.note.title && (
                    <h4 className="font-semibold mb-2 text-sm">{item.note.title}</h4>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {item.note.content}
                  </p>
                </div>
              )}
            </div>
          )}

          {item.itemType === "poll" && item.poll && (
            <div className="h-full p-2">
              <h4 className="font-semibold mb-3 text-sm">{item.poll.question}</h4>
              <div className="space-y-2">
                {item.poll.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs">{option}</span>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Poll
                </Badge>
              </div>
            </div>
          )}

          {item.itemType === "todo" && item.todo && (
            <div className="h-full p-2">
              <div className="flex items-center justify-between mb-2">
                <Badge className={`text-xs ${
                  item.todo.status === 'completed' ? 'bg-green-100 text-green-800' :
                  item.todo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.todo.status}
                </Badge>
                <Badge className={`text-xs ${
                  item.todo.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  item.todo.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  item.todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.todo.priority}
                </Badge>
              </div>
              <h4 className="font-semibold mb-2 text-sm">{item.todo.title}</h4>
              {item.todo.description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                  {item.todo.description}
                </p>
              )}
              {item.todo.totalTicks && item.todo.totalTicks > 1 && (
                <div className="text-xs text-blue-600">
                  {item.todo.currentTicks || 0}/{item.todo.totalTicks} ticks
                </div>
              )}
              <div className="absolute bottom-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  <CheckSquare className="w-3 h-3 mr-1" />
                  Todo
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}