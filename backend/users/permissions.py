from rest_framework.permissions import BasePermission

class IsVerifiedUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_verified

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsInstructorUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'instructor'
    
    def has_object_permission(self,request,view,obj):
        if hasattr(obj,'module') and hasattr(obj.module,'course'):
            return obj.module.course.instructor == request.user
        elif hasattr(obj,'instructor'):
            return obj.instrucor == request.user
        return False

    def has_object_permission(self, request, view, obj):
        return obj.instructor == request.user 

class IsStudentUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'