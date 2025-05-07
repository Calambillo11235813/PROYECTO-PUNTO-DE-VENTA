from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
#from rest_framework.permissions import IsAuthenticated
from accounts.models import Empleado
from accounts.serializers import EmpleadoSerializer

class EmpleadoListCreate(APIView):
    def get(self, request, usuario_id):
        empleados = Empleado.objects.filter(usuario_id=usuario_id)
        serializer = EmpleadoSerializer(empleados, many=True)
        return Response(serializer.data)

    def post(self, request, usuario_id):
        data = request.data.copy()
        data['usuario'] = usuario_id  # Tomamos el ID desde la URL

        serializer = EmpleadoSerializer(data=data)
        if serializer.is_valid():
            empleado = serializer.save()
            return Response(EmpleadoSerializer(empleado).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

