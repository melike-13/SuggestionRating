import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { USER_ROLES, type User } from "@shared/schema";
import TabNavigation from "@/components/TabNavigation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, UserPlus, Edit, UserCog, Trash2 } from "lucide-react";

export default function UserAdmin() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    displayName: "",
    department: "",
    role: USER_ROLES.EMPLOYEE,
    isAdmin: false
  });
  
  // Kullanıcı listesini çek
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Kullanıcı oluşturma
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await apiRequest("POST", "/api/users", userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Kullanıcı oluşturulurken bir hata oluştu");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateDialogOpen(false);
      resetNewUserForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const resetNewUserForm = () => {
    setNewUser({
      username: "",
      password: "",
      displayName: "",
      department: "",
      role: USER_ROLES.EMPLOYEE,
      isAdmin: false
    });
  };
  
  const handleCreateUser = () => {
    // Temel doğrulama
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Hata",
        description: "Kullanıcı adı ve şifre zorunludur.",
        variant: "destructive",
      });
      return;
    }
    
    createUserMutation.mutate(newUser);
  };
  
  const getRoleBadge = (user: User) => {
    if (user.isAdmin) return <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Genel Müdür</span>;
    if (user.role === USER_ROLES.MANAGER) return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Bölüm Müdürü</span>;
    return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Çalışan</span>;
  };
  
  // Üretim, Bakım, Kalite, İK, vs. departmanları
  const departments = [
    "Üretim",
    "Kalite",
    "İnsan Kaynakları",
    "Bakım",
    "Satın Alma",
    "Lojistik",
    "Satış",
    "Ar-Ge",
    "Yönetim",
    "Muhasebe",
    "Diğer"
  ];
  
  const handleRoleChange = (role: string) => {
    switch(role) {
      case USER_ROLES.ADMIN:
        setNewUser({...newUser, role: USER_ROLES.ADMIN, isAdmin: true});
        break;
      case USER_ROLES.MANAGER:
        setNewUser({...newUser, role: USER_ROLES.MANAGER, isAdmin: false});
        break;
      case USER_ROLES.EMPLOYEE:
        setNewUser({...newUser, role: USER_ROLES.EMPLOYEE, isAdmin: false});
        break;
    }
  };
  
  const getCurrentRole = () => {
    if (newUser.isAdmin) return USER_ROLES.ADMIN;
    return newUser.role;
  };
  
  return (
    <div>
      <TabNavigation activeTab="admin" user={null} />
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Kullanıcı Yönetimi</h2>
          <p className="text-neutral-700">Sistem kullanıcılarını yönetin</p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Yeni Kullanıcı
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              <p>Bir hata oluştu. Lütfen tekrar deneyin.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı Adı</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Sistemde kayıtlı kullanıcı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.displayName || "-"}</TableCell>
                      <TableCell>{user.department || "-"}</TableCell>
                      <TableCell>{getRoleBadge(user)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Yeni Kullanıcı Oluşturma Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Kullanıcı Adı
              </Label>
              <Input
                id="username"
                placeholder="1234"
                className="col-span-3"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Şifre
              </Label>
              <Input
                id="password"
                type="password"
                className="col-span-3"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">
                Ad Soyad
              </Label>
              <Input
                id="displayName"
                placeholder="Ad Soyad"
                className="col-span-3"
                value={newUser.displayName}
                onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Departman
              </Label>
              <Select
                value={newUser.department}
                onValueChange={(value) => setNewUser({...newUser, department: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Departman seçin" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <Select
                value={getCurrentRole()}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={USER_ROLES.EMPLOYEE}>Çalışan</SelectItem>
                  <SelectItem value={USER_ROLES.MANAGER}>Bölüm Müdürü</SelectItem>
                  <SelectItem value={USER_ROLES.ADMIN}>Genel Müdür</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={createUserMutation.isPending}>
              İptal
            </Button>
            <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}