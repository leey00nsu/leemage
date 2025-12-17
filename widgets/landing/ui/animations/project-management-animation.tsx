"use client";

import { Marquee } from "@/shared/ui/marquee";
import { Folder } from "lucide-react";

const projects = [
    { name: "웹사이트 에셋", description: "랜딩페이지 이미지", storage: "OCI" },
    { name: "마케팅 이미지", description: "SNS 광고 소재", storage: "R2" },
    { name: "제품 사진", description: "상품 상세 이미지", storage: "OCI" },
    { name: "블로그 미디어", description: "포스트 썸네일", storage: "R2" },
    { name: "앱 아이콘", description: "iOS/Android 아이콘", storage: "OCI" },
];

function ProjectCard({
    name,
    description,
    storage,
}: {
    name: string;
    description: string;
    storage: string;
}) {
    return (
        <div className="flex h-24 w-44 flex-col justify-between rounded-xl border bg-white p-3 shadow-sm dark:bg-gray-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{name}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${storage === "OCI" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                    {storage}
                </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
    );
}

export function ProjectManagementAnimation() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
            <Marquee pauseOnHover className="[--duration:25s]">
                {projects.map((project, idx) => (
                    <ProjectCard key={idx} {...project} />
                ))}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:25s] mt-3">
                {[...projects].reverse().map((project, idx) => (
                    <ProjectCard key={idx} {...project} />
                ))}
            </Marquee>
        </div>
    );
}
