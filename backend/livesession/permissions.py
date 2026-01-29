from rest_framework.permissions import BasePermission

class IsInstructorOfCourse(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not hasattr(obj, "course"):
            return False
        return obj.course.instructor_id == request.user.id

class IsEnrolledOrInstructor(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not hasattr(obj, "course"):
            return False
        c = obj.course
        return (
            c.instructor_id == request.user.id or
            c.enrolled_students.filter(id=request.user.id).exists()
        )
