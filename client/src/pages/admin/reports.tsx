import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { categoryLabels, statusLabels, Suggestion } from "@shared/schema";

export default function Reports() {
  const { data: suggestions = [] } = useQuery<Suggestion[]>({
    queryKey: ["/api/suggestions"],
  });

  const { data: statistics } = useQuery({
    queryKey: ["/api/statistics"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users/top-contributors"],
  });

  // Category chart data
  const categoryData = suggestions.reduce((acc: any[], suggestion) => {
    const category = suggestion.category;
    const existingCategory = acc.find((item) => item.category === category);
    
    if (existingCategory) {
      existingCategory.count += 1;
    } else {
      acc.push({
        category,
        categoryName: categoryLabels[category],
        count: 1,
      });
    }
    
    return acc;
  }, []);

  // Status chart data
  const statusData = [
    { name: statusLabels.new, value: statistics?.totalSuggestions - (statistics?.pendingReview + statistics?.approved + statistics?.implemented) || 0 },
    { name: statusLabels.under_review, value: statistics?.pendingReview || 0 },
    { name: statusLabels.approved, value: statistics?.approved || 0 },
    { name: statusLabels.implemented, value: statistics?.implemented || 0 },
  ];

  const COLORS = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c"];

  // Top contributors data
  const contributorsData = users.slice(0, 5).map((user: any) => ({
    name: user.fullName,
    points: user.points,
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Raporlar</h2>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="categories">Kategori Analizi</TabsTrigger>
          <TabsTrigger value="contributors">Katkı Sağlayanlar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Öneri Durumları</CardTitle>
                <CardDescription>Önerilerin mevcut durumlarına göre dağılımı</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value} öneri`, "Sayı"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Toplam İstatistikler</CardTitle>
                <CardDescription>Sistem genelinde özet veriler</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-6">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-slate-500">Toplam Öneri</dt>
                    <dd className="text-2xl font-semibold text-slate-900">{statistics?.totalSuggestions || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-slate-500">İnceleme Bekleyen</dt>
                    <dd className="text-2xl font-semibold text-slate-900">{statistics?.pendingReview || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-slate-500">Onaylanan</dt>
                    <dd className="text-2xl font-semibold text-slate-900">{statistics?.approved || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-slate-500">Uygulamaya Alınan</dt>
                    <dd className="text-2xl font-semibold text-slate-900">{statistics?.implemented || 0}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <dt className="text-sm font-medium text-slate-500">Toplam Ödül Miktarı</dt>
                    <dd className="text-2xl font-semibold text-slate-900">{(statistics?.totalRewards || 0).toLocaleString('tr-TR')}₺</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategori Bazında Öneriler</CardTitle>
              <CardDescription>Her kategoride kaç öneri olduğunu gösterir</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="categoryName" type="category" width={80} />
                  <Tooltip formatter={(value) => [`${value} öneri`, "Sayı"]} />
                  <Bar dataKey="count" fill="#3b82f6" barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>En Çok Katkı Sağlayanlar</CardTitle>
              <CardDescription>En yüksek puana sahip katkı sağlayanlar</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributorsData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} puan`, "Puan"]} />
                  <Bar dataKey="points" fill="#3b82f6" barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
