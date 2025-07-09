import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar,
  Trash2,
  Edit,
  Building2,
  Eye,
  EyeOff,
  Paperclip,
  Image,
  Volume2,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import type { TodoWithDetails } from "@shared/schema";

interface TodoCardProps {
  todo: TodoWithDetails;
  viewMode: "grid" | "list";
  onComplete: (todoId: number) => void;
  onDelete: (todoId: number) => void;
  onTick: (todoId: number) => void;
  onCompleteAll: (todoId: number) => void;
  showAssignedBy: boolean;
  onEdit?: () => void;
  onUpload?: (todoId: number) => void;
}

export default function TodoCard({ 
  todo, 
  viewMode, 
  onComplete, 
  onDelete, 
  onTick,
  onCompleteAll,
  showAssignedBy,
  onEdit,
  onUpload 
}: TodoCardProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDueDate = (date: Date | string | null) => {
    if (!date) return null;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "MMM d, yyyy");
  };

  const isOverdue = (dueDate: Date | string | null) => {
    if (!dueDate || todo.status === 'completed') return false;
    const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    return dateObj < new Date();
  };

  const getInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : "U";
  };

  if (viewMode === "list") {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(todo.status)}>
                  {todo.status === 'in_progress' ? 'In Progress' : todo.status}
                </Badge>
                <Badge className={getPriorityColor(todo.priority)}>
                  {getPriorityIcon(todo.priority)}
                  <span className="ml-1 capitalize">{todo.priority}</span>
                </Badge>
                {todo.isPrivate && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{todo.title}</h4>
                {todo.description && (
                  <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                )}
                
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  {todo.project && (
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-4 h-4" />
                      <span>{todo.project.name}</span>
                    </div>
                  )}
                  
                  {todo.dueDate && (
                    <div className={`flex items-center space-x-1 ${isOverdue(todo.dueDate) ? 'text-red-600' : ''}`}>
                      <Calendar className="w-4 h-4" />
                      <span>{formatDueDate(todo.dueDate)}</span>
                    </div>
                  )}
                  
                  {showAssignedBy ? (
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>by {todo.assignedByUser.firstName || todo.assignedByUser.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>to {todo.assignedToUser.firstName || todo.assignedToUser.email}</span>
                    </div>
                  )}
                  
                  {(todo.totalTicks || 1) > 1 && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <CheckSquare className="w-4 h-4" />
                      <span>{todo.currentTicks || 0}/{todo.totalTicks || 1} ticks</span>
                    </div>
                  )}
                  
                  {todo.attachmentUrl && (
                    <div className="flex items-center space-x-1 text-green-600">
                      {todo.attachmentType === 'image' ? (
                        <Image className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                      <span>
                        <a 
                          href={todo.attachmentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {todo.attachmentName || 'Attachment'}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {todo.status !== 'completed' && (
                <>
                  {(todo.totalTicks || 1) > 1 ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTick(todo.id)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Add one tick"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCompleteAll(todo.id)}
                        className="text-green-600 hover:text-green-700"
                        title="Complete all ticks"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <CheckSquare className="w-4 h-4 -ml-2" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onComplete(todo.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
              {onUpload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpload(todo.id)}
                  className="text-purple-600 hover:text-purple-700"
                  title="Upload file"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEdit}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(todo.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(todo.status)}>
              {todo.status === 'in_progress' ? 'In Progress' : todo.status}
            </Badge>
            <Badge className={getPriorityColor(todo.priority)}>
              {getPriorityIcon(todo.priority)}
              <span className="ml-1 capitalize">{todo.priority}</span>
            </Badge>
            {todo.isPrivate && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                <EyeOff className="w-3 h-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {todo.status !== 'completed' && (
              <>
                {(todo.totalTicks || 1) > 1 ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onTick(todo.id)}
                      className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                      title="Add one tick"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCompleteAll(todo.id)}
                      className="text-green-600 hover:text-green-700 h-8 w-8 p-0"
                      title="Complete all ticks"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <CheckSquare className="w-4 h-4 -ml-2" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onComplete(todo.id)}
                    className="text-green-600 hover:text-green-700 h-8 w-8 p-0"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
            {onUpload && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onUpload(todo.id)}
                className="text-purple-600 hover:text-purple-700 h-8 w-8 p-0"
                title="Upload file"
              >
                <Upload className="w-4 h-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                className="text-gray-600 hover:text-gray-700 h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(todo.id)}
              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">{todo.title}</h4>
            {todo.description && (
              <p className="text-sm text-gray-600">{todo.description}</p>
            )}
          </div>
          
          {todo.project && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Building2 className="w-4 h-4" />
              <span>{todo.project.name}</span>
            </div>
          )}
          
          {todo.dueDate && (
            <div className={`flex items-center space-x-2 text-sm ${isOverdue(todo.dueDate) ? 'text-red-600' : 'text-gray-500'}`}>
              <Calendar className="w-4 h-4" />
              <span>Due {formatDueDate(todo.dueDate)}</span>
              {isOverdue(todo.dueDate) && <span className="text-red-600 font-medium">(Overdue)</span>}
            </div>
          )}
          
          {(todo.totalTicks || 1) > 1 && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <CheckSquare className="w-4 h-4" />
              <span>{todo.currentTicks || 0}/{todo.totalTicks || 1} ticks completed</span>
            </div>
          )}
          
          {todo.attachmentUrl && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              {todo.attachmentType === 'image' ? (
                <Image className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span>
                <a 
                  href={todo.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {todo.attachmentName || 'Attachment'}
                </a>
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t">
            {showAssignedBy ? (
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={todo.assignedByUser.profileImageUrl || ""} />
                  <AvatarFallback className="text-xs">
                    {getInitials(todo.assignedByUser)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  Assigned by {todo.assignedByUser.firstName || todo.assignedByUser.email}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={todo.assignedToUser.profileImageUrl || ""} />
                  <AvatarFallback className="text-xs">
                    {getInitials(todo.assignedToUser)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  Assigned to {todo.assignedToUser.firstName || todo.assignedToUser.email}
                </span>
              </div>
            )}
            
            <span className="text-xs text-gray-400">
              {format(new Date(todo.createdAt), "MMM d")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}