from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Rol
from accounts.serializers import RolSerializer

class RolListCreate(APIView):
    def get(self, request):
        roles = Rol.objects.all()
        serializer = RolSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RolSerializer(data=request.data)
        if serializer.is_valid():
            rol = serializer.save()
            return Response(RolSerializer(rol).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
