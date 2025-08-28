"""
URL configuration for pytech project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Your app
    path('api/users/', include('users.urls')),
    path('api/admin/',include('adminpanel.urls')),
    path('api/',include('courses.urls')),
    path('api/payments/', include('payment.urls')),
    path('api/quiz/',include('quiz.urls')),
    path('api/meets/',include('meet.urls')),
    path('api/livesession/',include('livesession.urls')),
    path('api/chat/',include('chat.urls')),
    path('api/job/',include('job.urls')),
    # path('api/ai/', include('ai.urls')),

    # dj-rest-auth
    # path('auth/', include('dj_rest_auth.urls')),
    # path('auth/registration/', include('dj_rest_auth.registration.urls')),

    # Add this line for social login
    # path('auth/', include('allauth.socialaccount.urls')), 
]
