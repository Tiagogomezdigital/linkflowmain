"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, MoreHorizontal, Phone, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { formatPhoneNumber, formatTimeAgo } from "@/lib/utils"
import { getAllNumbers, updateNumber, deleteNumber, toggleNumberStatus } from "@/lib/api/numbers"
import { getGroups } from "@/lib/api/groups"
import type { WhatsAppNumber, Group } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface AllNumbersTableProps {
  searchTerm: string
}

export function AllNumbersTable({ searchTerm }: AllNumbersTableProps) {
  const { toast } = useToast()
  const [numbers, setNumbers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [numberToDelete, setNumberToDelete] = useState<WhatsAppNumber | null>(null)
  const [updatingNumbers, setUpdatingNumbers] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados para edição de número
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [numberToEdit, setNumberToEdit] = useState<WhatsAppNumber | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    group_id: "",
    custom_message: "",
    is_active: true,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [groupSelectOpen, setGroupSelectOpen] = useState(false)

  useEffect(() => {
    loadNumbers()
  }, [])

  const loadNumbers = async () => {
    try {
      setIsLoading(true)
      const data = await getAllNumbers()
      console.log("Números carregados:", data)
      setNumbers(data)
    } catch (error) {
      console.error("Error loading numbers:", error)
      toast({
        title: "Erro ao carregar números",
        description: "Não foi possível carregar a lista de números.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função de busca simplificada e robusta
  const filteredNumbers = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") {
      return numbers
    }

    const searchLower = searchTerm.toLowerCase().trim()
    console.log("Filtrando com termo:", searchLower)

    const filtered = numbers.filter((number) => {
      // Campos para buscar
      const phoneClean = number.phone?.replace(/\D/g, "") || ""
      const phoneFormatted = formatPhoneNumber(number.phone) || ""
      const numberName = number.name?.toLowerCase() || ""
      const groupName = number.groups?.name?.toLowerCase() || ""
      const groupDescription = number.groups?.description?.toLowerCase() || ""
      const groupSlug = number.groups?.slug?.toLowerCase() || ""

      // Verificar se o termo de busca está em algum dos campos
      const matches =
        phoneClean.includes(searchLower.replace(/\D/g, "")) ||
        phoneFormatted.toLowerCase().includes(searchLower) ||
        numberName.includes(searchLower) ||
        groupName.includes(searchLower) ||
        groupDescription.includes(searchLower) ||
        groupSlug.includes(searchLower)

      if (matches) {
        console.log("Match encontrado:", {
          id: number.id,
          phone: number.phone,
          name: number.name,
          group: number.groups?.name,
        })
      }

      return matches
    })

    console.log(`Filtrados: ${filtered.length} de ${numbers.length} números`)
    return filtered
  }, [numbers, searchTerm])

  const handleToggleActive = async (numberId: string, isActive: boolean) => {
    setUpdatingNumbers((prev) => new Set(prev).add(numberId))

    try {
      await toggleNumberStatus(numberId, isActive)
      setNumbers((prev) => prev.map((number) => (number.id === numberId ? { ...number, is_active: isActive } : number)))

      toast({
        title: isActive ? "Número ativado" : "Número desativado",
        description: `O número foi ${isActive ? "ativado" : "desativado"} com sucesso.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating number:", error)
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do número.",
        variant: "destructive",
      })
    } finally {
      setUpdatingNumbers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(numberId)
        return newSet
      })
    }
  }

  const handleDeleteClick = (number: WhatsAppNumber) => {
    setNumberToDelete(number)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!numberToDelete) return

    try {
      setIsDeleting(true)
      await deleteNumber(numberToDelete.id)
      setNumbers((prev) => prev.filter((number) => number.id !== numberToDelete.id))

      toast({
        title: "Número excluído",
        description: "O número foi removido com sucesso.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error deleting number:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o número.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setNumberToDelete(null)
    }
  }

  // Carregar grupos
  const loadGroups = async () => {
    try {
      setIsLoadingGroups(true)
      const groupsData = await getGroups()
      setGroups(groupsData)
    } catch (error) {
      console.error("Error loading groups:", error)
    } finally {
      setIsLoadingGroups(false)
    }
  }

  // Funções para edição de número
  const handleEditClick = (number: WhatsAppNumber) => {
    setNumberToEdit(number)
    setEditForm({
      name: number.name || "",
      phone: number.phone,
      group_id: number.group_id,
      custom_message: number.custom_message || "",
      is_active: number.is_active,
    })
    setEditDialogOpen(true)
    if (groups.length === 0) {
      loadGroups()
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!numberToEdit) return

    try {
      setIsEditing(true)
      await updateNumber(numberToEdit.id, {
        name: editForm.name,
        phone: editForm.phone,
        group_id: editForm.group_id,
        custom_message: editForm.custom_message,
        is_active: editForm.is_active,
      })

      // Atualizar a lista local
      setNumbers((prev) =>
        prev.map((number) =>
          number.id === numberToEdit.id
            ? {
                ...number,
                name: editForm.name,
                phone: editForm.phone,
                group_id: editForm.group_id,
                custom_message: editForm.custom_message,
                is_active: editForm.is_active,
              }
            : number,
        ),
      )

      toast({
        title: "Número atualizado",
        description: "O número foi atualizado com sucesso.",
        variant: "default",
      })
      setEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating number:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o número.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="ds-table-container">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mx-auto"></div>
          <p className="text-slate-400 mt-2">Carregando números...</p>
        </div>
      </div>
    )
  }

  if (filteredNumbers.length === 0 && !searchTerm) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 mb-4">
          <Phone className="mx-auto h-12 w-12 text-slate-600" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Nenhum número cadastrado</h3>
        <p className="text-slate-400 mb-4">Comece adicionando números de WhatsApp nos grupos.</p>
      </div>
    )
  }

  if (filteredNumbers.length === 0 && searchTerm) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">Nenhum número encontrado para "{searchTerm}"</p>
        <p className="text-slate-500 text-sm mt-2">Tente buscar por: número, nome, grupo ou descrição</p>
      </div>
    )
  }

  return (
    <>
      <div className="ds-table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="ds-table-header-sticky">
              <tr>
                <th className="ds-table-header text-left py-4 px-6">Número</th>
                <th className="ds-table-header text-left py-4 px-6">Grupo</th>
                <th className="ds-table-header text-left py-4 px-6">Status</th>
                <th className="ds-table-header text-left py-4 px-6">Último Uso</th>
                <th className="ds-table-header text-right py-4 px-6">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredNumbers.map((number) => (
                <tr key={number.id} className="ds-table-row">
                  <td className="ds-table-cell">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-lime-400" />
                      <div>
                        <div className="ds-phone-number">{formatPhoneNumber(number.phone)}</div>
                        {number.name && <div className="text-sm text-slate-400">{number.name}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="ds-table-cell">
                    <span className="ds-group-associated">{number.groups?.name || "Grupo não encontrado"}</span>
                  </td>
                  <td className="ds-table-cell">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={number.is_active}
                        onCheckedChange={(checked) => handleToggleActive(number.id, checked)}
                        disabled={updatingNumbers.has(number.id)}
                        className="data-[state=checked]:bg-lime-400 scale-110"
                      />
                      <span
                        className={
                          number.is_active
                            ? "ds-status-active ds-status-badge px-2 py-1 rounded"
                            : "ds-status-inactive ds-status-badge px-2 py-1 rounded"
                        }
                      >
                        {number.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </td>
                  <td className="ds-table-cell">
                    <span className="ds-last-used">
                      {number.last_used_at ? formatTimeAgo(new Date(number.last_used_at)) : "Nunca usado"}
                    </span>
                  </td>
                  <td className="ds-table-cell text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ds-button-icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          className="text-slate-300 focus:bg-slate-700 focus:text-white"
                          onClick={() => handleEditClick(number)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 focus:bg-red-900 focus:text-red-300"
                          onClick={() => handleDeleteClick(number)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="ds-modal-container max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir número</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir o número {numberToDelete && formatPhoneNumber(numberToDelete.phone)}? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="ds-button-outline" disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Número</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Grupo *</Label>
                <Popover open={groupSelectOpen} onOpenChange={setGroupSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={groupSelectOpen}
                      className="w-full justify-between bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
                    >
                      {editForm.group_id
                        ? groups.find((group) => group.id === editForm.group_id)?.name
                        : "Selecione um grupo..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-slate-900 border-slate-700">
                    <Command className="bg-slate-900">
                      <CommandInput placeholder="Buscar grupo..." className="bg-slate-900 border-slate-700" />
                      <CommandList>
                        <CommandEmpty>Nenhum grupo encontrado.</CommandEmpty>
                        <CommandGroup>
                          {groups.map((group) => (
                            <CommandItem
                              key={group.id}
                              value={group.name}
                              onSelect={() => {
                                setEditForm({ ...editForm, group_id: group.id })
                                setGroupSelectOpen(false)
                              }}
                              className="text-white hover:bg-slate-800"
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  editForm.group_id === group.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {group.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Número de telefone *</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Descrição (opcional)</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Ex: Atendimento principal"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_message">Mensagem Personalizada (opcional)</Label>
                <Textarea
                  id="custom_message"
                  value={editForm.custom_message}
                  onChange={(e) => setEditForm({ ...editForm, custom_message: e.target.value })}
                  placeholder="Ex: Olá! Sou da equipe de vendas. Como posso ajudar?"
                  rows={3}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <p className="text-sm text-slate-400">
                  Se não informada, será usada a mensagem padrão do grupo
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                  className="data-[state=checked]:bg-lime-400"
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                disabled={isEditing}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-lime-400 text-black hover:bg-lime-500" disabled={isEditing}>
                {isEditing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
