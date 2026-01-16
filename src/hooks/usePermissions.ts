import { useAuth } from './useAuth';

export type PermissionLevel = 'apontador' | 'sala_tecnica' | 'administrador';

export function usePermissions() {
  const { role } = useAuth();

  // Mapear roles do sistema para níveis de permissão do Painel do Apontador
  const getPermissionLevel = (): PermissionLevel => {
    switch (role) {
      case 'admin_principal':
        return 'administrador';
      case 'admin':
        return 'sala_tecnica';
      case 'colaborador':
      case 'visualizacao':
      default:
        return 'apontador';
    }
  };

  const permissionLevel = getPermissionLevel();

  // Funções de verificação de permissão
  const isApontador = permissionLevel === 'apontador';
  const isSalaTecnica = permissionLevel === 'sala_tecnica' || permissionLevel === 'administrador';
  const isAdministrador = permissionLevel === 'administrador';

  // Verifica se pode editar data (somente Sala Técnica e Admin)
  const canEditDate = isSalaTecnica;

  // Verifica se pode ver número de viagens (somente Sala Técnica e Admin)
  const canSeeTrips = isSalaTecnica;

  // Verifica se pode acessar cadastros (somente Sala Técnica e Admin)
  const canAccessCadastros = isSalaTecnica;

  // Verifica se pode editar todos os campos
  const canEditAllFields = isSalaTecnica;

  // Verifica se pode ver relatórios completos
  const canSeeFullReports = isSalaTecnica;

  return {
    permissionLevel,
    isApontador,
    isSalaTecnica,
    isAdministrador,
    canEditDate,
    canSeeTrips,
    canAccessCadastros,
    canEditAllFields,
    canSeeFullReports,
  };
}
