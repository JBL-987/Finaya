import React, { useEffect, useState } from "react";
import { Box, Lock, Search, Settings, Sparkles, MapPin, TrendingUp, History, User } from "lucide-react";
import { GlowingEffect } from "../components/ui/GlowingEffect";
import { cn } from "../lib/utils";
import { analysisAPI, authAPI } from "../services/api";
import { firebaseAuth } from "../services/firebase";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../components/ui/chart";
import AIAdvisor from "../components/AIAdvisor";

const GridItem = ({ area, icon, title, description, content, link }) => {
  const Wrapper = link ? Link : "div";
  const wrapperProps = link ? { to: link } : {};

  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
        <Wrapper {...wrapperProps} className="block h-full w-full">
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
              {icon}
            </div>
            <div className="space-y-3 w-full h-full">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {title}
              </h3>
              <div className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
                {content && <div className="mt-4">{content}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      </Wrapper>
    </li>
  );
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalAnalyses: 0,
        recentAnalyses: [],
        topCategory: "N/A",
        topCategory: "N/A",
        userName: "User",
        userPhoto: null,
        chartData: []
    });
    const [loading, setLoading] = useState(true);

    const chartConfig = {
      analyses: {
        label: "Analyses",
        color: "hsl(48, 96%, 53%)", // Yellow-500 equivalent #eab308, but user asked for "Golden" so lets use existing yellow-400/500
      },
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user profile
                const currentUser = await authAPI.getCurrentUser();
                
                // Fetch analysis history
                const analyses = await analysisAPI.getAll(0, 50); 
                
                // Process data
                const analysisList = Array.isArray(analyses) ? analyses : (analyses.items || []);
                
                const total = analysisList.length;
                
                // Sort by date 
                const sorted = [...analysisList].sort((a, b) => {
                    return new Date(b.created_at) - new Date(a.created_at);
                });

                const recent = sorted.slice(0, 3);
                
                // Calculate Top Category
                const categories = {};
                analysisList.forEach(a => {
                    const type = a.data?.business_params?.business_type || "General";
                    categories[type] = (categories[type] || 0) + 1;
                });
                
                let topCat = "None";
                let maxCount = 0;
                Object.entries(categories).forEach(([cat, count]) => {
                    if(count > maxCount) {
                        maxCount = count;
                        topCat = cat;
                    }
                });

                // Prepare Chart Data (Analyses per Month)
                const chartDataMap = {};
                // Initialize last 12 months
                for (let i = 11; i >= 0; i--) {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  const key = d.toLocaleString('default', { month: 'short' });
                  chartDataMap[key] = 0;
                }

                analysisList.forEach(a => {
                    if (a.created_at) {
                        const date = new Date(a.created_at);
                        const month = date.toLocaleString('default', { month: 'short' });
                        if (chartDataMap.hasOwnProperty(month)) {
                            chartDataMap[month]++;
                        }
                    }
                });

                const chartData = Object.keys(chartDataMap).map(key => ({
                    date: key,
                    analyses: chartDataMap[key]
                }));


                // Get Firebase User for Photo URL
                const fbUser = firebaseAuth.getCurrentUser();
                
                setStats({
                    totalAnalyses: total,
                    recentAnalyses: recent,
                    topCategory: topCat === "None" ? "No data yet" : topCat,
                    userName: currentUser?.full_name || currentUser?.email?.split('@')[0] || "Trader",
                    userPhoto: fbUser?.photoURL || null,
                    chartData: chartData
                });

            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
             <div className="min-h-screen bg-background p-8 pt-24 text-center">
                <p className="text-muted-foreground">Loading dashboard...</p>
             </div>
        );
    }

  return (
    <div className="min-h-screen bg-background p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
            {stats.userPhoto && (
                <img 
                    src={stats.userPhoto} 
                    alt="Profile" 
                    className="h-12 w-12 rounded-full border-2 border-yellow-500 shadow-md object-cover"
                />
            )}
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {stats.userName}</h1>
        </div>
        <p className="text-muted-foreground mb-8">Here's an overview of your location analysis activity.</p>
        
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-12 lg:gap-4">
          
          {/* Main Stat: Total Analyses */}
          <GridItem
            area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
            icon={<TrendingUp className="h-4 w-4" />}
            title="Total Analyses"
            description="Total locations you have analyzed."
            content={
                <div className="text-5xl font-bold text-foreground mt-2">
                    {stats.totalAnalyses}
                </div>
            }
          />

          {/* New Search Action */}
           <GridItem
            area="md:[grid-area:2/1/3/7] xl:[grid-area:2/1/3/5]"
            icon={<Search className="h-4 w-4" />}
            title="New Analysis"
            description="Start a new location analysis now."
            link="/app"
            content={<div className="text-sm text-yellow-500 font-semibold mt-2">Click to start &rarr;</div>}
          />


          {/* Chart Area - Replaces Recent Activity & More */}
          <GridItem
            area="md:[grid-area:1/7/3/13] xl:[grid-area:1/5/3/13]"
            icon={<History className="h-4 w-4" />}
            title="Analysis Trends"
            description="Usage activity over the last 12 months."
            content={
              <div className="h-[250px] w-full mt-4">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <AreaChart
                      accessibilityLayer
                      data={stats.chartData}
                      margin={{
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Area
                        dataKey="analyses"
                        type="natural"
                        fill="#facc15"
                        fillOpacity={0.4}
                        stroke="#facc15"
                      />
                    </AreaChart>
                  </ChartContainer>
              </div>
            }
          />
          {/* AI Strategic Advisor - Full Width Integrated Card */}
          <li className="min-h-[14rem] list-none md:col-span-12 xl:col-span-12 md:row-span-2">
            <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
                <div className="relative flex flex-1 flex-col gap-4 h-full">
                  {/* Header Section */}
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div className="space-y-1">
                           <h3 className="text-xl font-semibold font-sans tracking-tight text-foreground">
                             Strategic AI Advisor
                           </h3>
                           <p className="text-sm text-muted-foreground font-sans">
                             Expert analysis and recommendations for your location.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Chat Content */}
                  <div className="flex-1 min-h-[400px] relative">
                     <AIAdvisor 
                        analysisData={stats.recentAnalyses.length > 0 ? {
                            locationName: stats.recentAnalyses[0].name,
                            metrics: stats.recentAnalyses[0].data?.metrics,
                            areaDistribution: stats.recentAnalyses[0].data?.areaDistribution || stats.recentAnalyses[0].gemini_analysis?.area_distribution,
                            competitors: [] 
                        } : null} 
                        businessParams={stats.recentAnalyses.length > 0 ? stats.recentAnalyses[0].data?.business_params : {}}
                    />
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
