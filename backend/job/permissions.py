from rest_framework.permissions import BasePermission,SAFE_METHODS

class IsRecruiter(BasePermission):
    def has_permission(self,request,view):
        return request.user.is_authenticated and request.user.role == "recruiter"
    
class IsStudent(BasePermission):
    def has_permission(self,request,view):
        return request.user.is_authenticated and request.user.role == "student" 

class IsAdmin(BasePermission):
    def has_permission(self,request,view):
        return request.user.is_authenticated and request.user.role == "admin" 

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if hasattr(obj,"recruiter"):
            return obj.recruiter.user == request.user
        if hasattr(obj,"student"):
            return obj.student == request.user
        return False