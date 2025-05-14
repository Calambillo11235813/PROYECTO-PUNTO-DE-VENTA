from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Privilegio
from accounts.serializers import PrivilegioSerializer

class PrivilegioListCreate(APIView):
    def get(self, request):
        privilegios = Privilegio.objects.all()
        serializer = PrivilegioSerializer(privilegios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PrivilegioSerializer(data=request.data)
        if serializer.is_valid():
            privilegio = serializer.save()
            return Response(PrivilegioSerializer(privilegio).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
