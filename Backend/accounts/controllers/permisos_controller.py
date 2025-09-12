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

    def put(self, request, rol_id):
        """Actualiza un privilegio existente para el rol"""
        privilegio_id_actual = request.data.get("privilegio_id_actual")
        if not privilegio_id_actual:
            return Response({
                "error": "Debe proporcionar privilegio_id_actual"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        nuevo_privilegio_id = request.data.get("privilegio_id")
        estado = request.data.get("estado")
        
        if not nuevo_privilegio_id and estado is None:
            return Response({
                "error": "Debe proporcionar al menos privilegio_id o estado"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Obtener el rol
            rol = get_object_or_404(Rol, id=rol_id)
            
            # Buscar el privilegio actual
            privilegio_actual = get_object_or_404(Privilegio, id=privilegio_id_actual)
            permiso = get_object_or_404(Permisos, rol=rol, privilegio=privilegio_actual)
            
            # Actualizar el privilegio si se proporciona
            if nuevo_privilegio_id:
                nuevo_privilegio = get_object_or_404(Privilegio, id=nuevo_privilegio_id)
                
                # Verificar duplicados
                if nuevo_privilegio_id != permiso.privilegio.id:
                    permiso_existente = Permisos.objects.filter(
                        rol=rol, 
                        privilegio=nuevo_privilegio
                    ).first()
                    
                    if permiso_existente:
                        return Response({
                            "error": "Ya existe un permiso para este rol y privilegio"
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                permiso.privilegio = nuevo_privilegio
            
            # Actualizar estado si se proporciona
            if estado is not None:
                permiso.estado = estado
            
            permiso.save()
            
            return Response({
                "mensaje": "Permiso actualizado correctamente",
                "rol": rol.nombre_rol,
                "privilegio": permiso.privilegio.descripcion,
                "estado": permiso.estado
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Error al actualizar el permiso: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, rol_id, privilegio_id=None):
        """
        Elimina un privilegio de un rol
        
        Se puede proporcionar el privilegio_id de dos formas:
        1. Como parte de la URL: /roles/<rol_id>/privilegios/<privilegio_id>/
        2. Como parámetro de consulta: /roles/<rol_id>/privilegios/?privilegio_id=<privilegio_id>
        """
        # Si no viene en la URL, buscar en los parámetros de consulta
        if privilegio_id is None:
            privilegio_id = request.query_params.get("privilegio_id")
        
        if not privilegio_id:
            return Response({
                "error": "Debe proporcionar privilegio_id en la URL o como parámetro de consulta"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rol = get_object_or_404(Rol, id=rol_id)
            privilegio = get_object_or_404(Privilegio, id=privilegio_id)
            
            permiso = Permisos.objects.filter(rol=rol, privilegio=privilegio).first()
            
            if not permiso:
                return Response({
                    "error": "El permiso especificado no existe"
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Eliminar físicamente el permiso
            permiso.delete()
            
            return Response({
                "mensaje": "Permiso eliminado correctamente",
                "rol": rol.nombre_rol,
                "privilegio": privilegio.descripcion
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Error al eliminar el permiso: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
