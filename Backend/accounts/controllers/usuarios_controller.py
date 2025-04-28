from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Usuario
from accounts.serializers import UsuarioSerializer
from django.shortcuts import get_object_or_404
from django.db.models import Q


class UsuarioListCreate(APIView):
    def get(self, request):
        usuarios = Usuario.objects.all()
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        contraseña = data.pop('password', None)

        serializer = UsuarioSerializer(data=data)

        if serializer.is_valid():
            usuario = serializer.save()
            if contraseña:
                usuario.set_password(contraseña)
                usuario.save()

            return Response(UsuarioSerializer(usuario).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class UsuarioDetail(APIView):
    def get(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)
        serializer = UsuarioSerializer(usuario)
        return Response(serializer.data)

    def put(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)
        serializer = UsuarioSerializer(usuario, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)
        usuario.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

        




class ClienteListAPIView(APIView):
    def get(self, request, empresa_id):                         
        rol_id = 3# Fijamos el rol_id en 2 de forma estática

        serializer = UsuarioSerializer(clientes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

