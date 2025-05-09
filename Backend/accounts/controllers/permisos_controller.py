from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Rol, Privilegio, Permisos
from accounts.serializers import PrivilegioSerializer
from django.shortcuts import get_object_or_404

class RolPrivilegiosView(APIView):
    def get(self, request, rol_id):
        rol = get_object_or_404(Rol, id=rol_id)
        permisos = Permisos.objects.filter(rol=rol, estado=True)
        privilegios = [p.privilegio for p in permisos]
        serializer = PrivilegioSerializer(privilegios, many=True)
        return Response(serializer.data)

    def post(self, request, rol_id):
        privilegio_id = request.data.get("privilegio_id")
        estado = request.data.get("estado", True)

        rol = get_object_or_404(Rol, id=rol_id)
        privilegio = get_object_or_404(Privilegio, id=privilegio_id)

        permiso, created = Permisos.objects.get_or_create(rol=rol, privilegio=privilegio)
        permiso.estado = estado
        permiso.save()

        return Response({
            "mensaje": "Permiso asignado correctamente" if estado else "Permiso desactivado",
            "rol": rol.nombre_rol,
            "privilegio": privilegio.descripcion,
            "estado": permiso.estado
        }, status=status.HTTP_200_OK)
