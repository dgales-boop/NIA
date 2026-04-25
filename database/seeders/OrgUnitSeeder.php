<?php

namespace Database\Seeders;

use App\Models\OrgUnit;
use Illuminate\Database\Seeder;

class OrgUnitSeeder extends Seeder
{
    public function run(): void
    {
        $regions = [
            ['code' => 'R01', 'name' => 'Region I - Ilocos', 'imos' => [
                ['code' => 'IMO-ILN', 'name' => 'IMO Ilocos Norte', 'sections' => [
                    ['code' => 'SEC-LAO', 'name' => 'Laoag Irrigation System'],
                    ['code' => 'SEC-BAT', 'name' => 'Batac Irrigation System'],
                ]],
                ['code' => 'IMO-ILS', 'name' => 'IMO Ilocos Sur', 'sections' => [
                    ['code' => 'SEC-VIG', 'name' => 'Vigan Irrigation System'],
                ]],
                ['code' => 'IMO-LUN', 'name' => 'IMO La Union'],
                ['code' => 'IMO-PAN', 'name' => 'IMO Pangasinan', 'sections' => [
                    ['code' => 'SEC-DAG', 'name' => 'Dagupan Irrigation System'],
                    ['code' => 'SEC-URD', 'name' => 'Urdaneta Irrigation System'],
                ]],
            ]],
            ['code' => 'R02', 'name' => 'Region II - Cagayan Valley', 'imos' => [
                ['code' => 'IMO-CAG', 'name' => 'IMO Cagayan', 'sections' => [
                    ['code' => 'SEC-TUG', 'name' => 'Tuguegarao Irrigation System'],
                ]],
                ['code' => 'IMO-ISA', 'name' => 'IMO Isabela', 'sections' => [
                    ['code' => 'SEC-SAN', 'name' => 'Santiago Irrigation System'],
                    ['code' => 'SEC-ILG', 'name' => 'Ilagan Irrigation System'],
                ]],
                ['code' => 'IMO-NUV', 'name' => 'IMO Nueva Vizcaya'],
                ['code' => 'IMO-QUI', 'name' => 'IMO Quirino'],
            ]],
            ['code' => 'R03', 'name' => 'Region III - Central Luzon', 'imos' => [
                ['code' => 'IMO-TAR', 'name' => 'IMO Tarlac', 'sections' => [
                    ['code' => 'SEC-TRC', 'name' => 'Tarlac City Irrigation System'],
                ]],
                ['code' => 'IMO-NUE', 'name' => 'IMO Nueva Ecija', 'sections' => [
                    ['code' => 'SEC-CAB', 'name' => 'Cabanatuan Irrigation System'],
                    ['code' => 'SEC-MUN', 'name' => 'Muñoz Irrigation System'],
                    ['code' => 'SEC-PAL', 'name' => 'Palayan Irrigation System'],
                ]],
                ['code' => 'IMO-PAM', 'name' => 'IMO Pampanga'],
                ['code' => 'IMO-BUL', 'name' => 'IMO Bulacan'],
                ['code' => 'IMO-ZAM', 'name' => 'IMO Zambales'],
            ]],
            ['code' => 'R04A', 'name' => 'Region IV-A - CALABARZON', 'imos' => [
                ['code' => 'IMO-LAG', 'name' => 'IMO Laguna'],
                ['code' => 'IMO-BAT', 'name' => 'IMO Batangas'],
                ['code' => 'IMO-QUE', 'name' => 'IMO Quezon'],
                ['code' => 'IMO-CAV', 'name' => 'IMO Cavite'],
                ['code' => 'IMO-RIZ', 'name' => 'IMO Rizal'],
            ]],
            ['code' => 'R04B', 'name' => 'Region IV-B - MIMAROPA', 'imos' => [
                ['code' => 'IMO-MOR', 'name' => 'IMO Occidental Mindoro'],
                ['code' => 'IMO-MOE', 'name' => 'IMO Oriental Mindoro'],
                ['code' => 'IMO-PAL', 'name' => 'IMO Palawan'],
                ['code' => 'IMO-MAR', 'name' => 'IMO Marinduque'],
                ['code' => 'IMO-ROM', 'name' => 'IMO Romblon'],
            ]],
            ['code' => 'R05', 'name' => 'Region V - Bicol', 'imos' => [
                ['code' => 'IMO-CAN', 'name' => 'IMO Camarines Norte'],
                ['code' => 'IMO-CAS', 'name' => 'IMO Camarines Sur', 'sections' => [
                    ['code' => 'SEC-NAG', 'name' => 'Naga Irrigation System'],
                ]],
                ['code' => 'IMO-ALB', 'name' => 'IMO Albay'],
                ['code' => 'IMO-SOR', 'name' => 'IMO Sorsogon'],
            ]],
            ['code' => 'R06', 'name' => 'Region VI - Western Visayas', 'imos' => [
                ['code' => 'IMO-ILO', 'name' => 'IMO Iloilo', 'sections' => [
                    ['code' => 'SEC-JRO', 'name' => 'Jalaur River IS'],
                ]],
                ['code' => 'IMO-NEG', 'name' => 'IMO Negros Occidental'],
                ['code' => 'IMO-ANT', 'name' => 'IMO Antique'],
                ['code' => 'IMO-CAP', 'name' => 'IMO Capiz'],
            ]],
            ['code' => 'R07', 'name' => 'Region VII - Central Visayas', 'imos' => [
                ['code' => 'IMO-CEB', 'name' => 'IMO Cebu'],
                ['code' => 'IMO-BOH', 'name' => 'IMO Bohol'],
                ['code' => 'IMO-NEO', 'name' => 'IMO Negros Oriental'],
                ['code' => 'IMO-SIQ', 'name' => 'IMO Siquijor'],
            ]],
            ['code' => 'R08', 'name' => 'Region VIII - Eastern Visayas', 'imos' => [
                ['code' => 'IMO-LEY', 'name' => 'IMO Leyte'],
                ['code' => 'IMO-SAM', 'name' => 'IMO Samar'],
                ['code' => 'IMO-EAS', 'name' => 'IMO Eastern Samar'],
                ['code' => 'IMO-SLE', 'name' => 'IMO Southern Leyte'],
            ]],
            ['code' => 'R09', 'name' => 'Region IX - Zamboanga Peninsula', 'imos' => [
                ['code' => 'IMO-ZAN', 'name' => 'IMO Zamboanga del Norte'],
                ['code' => 'IMO-ZAS', 'name' => 'IMO Zamboanga del Sur'],
                ['code' => 'IMO-ZSI', 'name' => 'IMO Zamboanga Sibugay'],
            ]],
            ['code' => 'R10', 'name' => 'Region X - Northern Mindanao', 'imos' => [
                ['code' => 'IMO-BUK', 'name' => 'IMO Bukidnon', 'sections' => [
                    ['code' => 'SEC-MAL', 'name' => 'Malaybalay Irrigation System'],
                ]],
                ['code' => 'IMO-MIS', 'name' => 'IMO Misamis Oriental'],
                ['code' => 'IMO-MIO', 'name' => 'IMO Misamis Occidental'],
                ['code' => 'IMO-LAN', 'name' => 'IMO Lanao del Norte'],
            ]],
            ['code' => 'R11', 'name' => 'Region XI - Davao', 'imos' => [
                ['code' => 'IMO-DVN', 'name' => 'IMO Davao del Norte'],
                ['code' => 'IMO-DVS', 'name' => 'IMO Davao del Sur'],
                ['code' => 'IMO-DVO', 'name' => 'IMO Davao Oriental'],
                ['code' => 'IMO-DVW', 'name' => 'IMO Davao de Oro'],
            ]],
            ['code' => 'R12', 'name' => 'Region XII - SOCCSKSARGEN', 'imos' => [
                ['code' => 'IMO-COT', 'name' => 'IMO Cotabato', 'sections' => [
                    ['code' => 'SEC-KID', 'name' => 'Kidapawan Irrigation System'],
                ]],
                ['code' => 'IMO-SUL', 'name' => 'IMO Sultan Kudarat'],
                ['code' => 'IMO-SAR', 'name' => 'IMO Sarangani'],
                ['code' => 'IMO-GEN', 'name' => 'IMO South Cotabato'],
            ]],
            ['code' => 'R13', 'name' => 'Region XIII - CARAGA', 'imos' => [
                ['code' => 'IMO-ADN', 'name' => 'IMO Agusan del Norte', 'sections' => [
                    ['code' => 'SEC-BUT', 'name' => 'Butuan Irrigation System'],
                    ['code' => 'SEC-CBD', 'name' => 'Cabadbaran Irrigation System'],
                ]],
                ['code' => 'IMO-ADS', 'name' => 'IMO Agusan del Sur', 'sections' => [
                    ['code' => 'SEC-PRO', 'name' => 'Prosperidad Irrigation System'],
                ]],
                ['code' => 'IMO-SDN', 'name' => 'IMO Surigao del Norte', 'sections' => [
                    ['code' => 'SEC-MNT', 'name' => 'Mainit Irrigation System'],
                    ['code' => 'SEC-DIG', 'name' => 'Dinagat Area Office'],
                ]],
                ['code' => 'IMO-SDS', 'name' => 'IMO Surigao del Sur', 'sections' => [
                    ['code' => 'SEC-BIS', 'name' => 'Bislig Irrigation System'],
                    ['code' => 'SEC-TAN', 'name' => 'Tandag Irrigation System'],
                ]],
            ]],
            ['code' => 'CAR', 'name' => 'CAR - Cordillera Administrative Region', 'imos' => [
                ['code' => 'IMO-BEN', 'name' => 'IMO Benguet', 'sections' => [
                    ['code' => 'SEC-LAT', 'name' => 'La Trinidad Irrigation System'],
                ]],
                ['code' => 'IMO-IFU', 'name' => 'IMO Ifugao'],
                ['code' => 'IMO-MTN', 'name' => 'IMO Mountain Province'],
                ['code' => 'IMO-KAL', 'name' => 'IMO Kalinga'],
                ['code' => 'IMO-APA', 'name' => 'IMO Apayao'],
                ['code' => 'IMO-ABR', 'name' => 'IMO Abra'],
            ]],
        ];

        foreach ($regions as $regionData) {
            $region = OrgUnit::query()->updateOrCreate(
                ['code' => $regionData['code']],
                [
                    'name' => $regionData['name'],
                    'level_type' => 'region',
                    'parent_id' => null,
                ]
            );

            foreach ($regionData['imos'] as $imoData) {
                $imo = OrgUnit::query()->updateOrCreate(
                    ['code' => $imoData['code']],
                    [
                        'name' => $imoData['name'],
                        'level_type' => 'imo',
                        'parent_id' => $region->id,
                    ]
                );

                // 3rd level: Sections / Irrigation Systems
                if (!empty($imoData['sections'])) {
                    foreach ($imoData['sections'] as $sectionData) {
                        OrgUnit::query()->updateOrCreate(
                            ['code' => $sectionData['code']],
                            [
                                'name' => $sectionData['name'],
                                'level_type' => 'section',
                                'parent_id' => $imo->id,
                            ]
                        );
                    }
                }
            }
        }
    }
}
